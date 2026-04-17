/**
 * Forge Build Script
 * 
 * Bundles the runtime using esbuild. Two modes:
 * - artifact: inline everything (Lit + TinyBase + Ajv + all components)
 * - standalone: external deps from CDN (smaller, needs network)
 */

import { build } from 'esbuild';
import { statSync, mkdirSync, copyFileSync, readdirSync, rmSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const mode = process.argv.includes('--mode=artifact') ? 'artifact'
           : process.argv.includes('--mode=standalone') ? 'standalone'
           : process.argv.includes('--mode=server') ? 'server'
           : process.argv.includes('--mode=server-cli') ? 'server-cli'
           : process.argv.includes('--mode=connect') ? 'connect'
           : process.argv.includes('--mode=cli') ? 'cli'
           : process.argv.includes('--mode=types') ? 'types'
           : 'all';

const isDev = process.argv.includes('--dev');

const sharedConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: !isDev,
  target: 'es2020',
  sourcemap: isDev,
  legalComments: 'none',
  treeShaking: true,
};

async function buildArtifact() {
  console.log('📦 Building artifact bundle (IIFE, all inline)...');
  await build({
    ...sharedConfig,
    format: 'iife',
    globalName: 'ForgeUI',
    outfile: 'dist/forgeui.js',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    // Inline everything for zero-dependency artifact mode
    external: [],
  });
  console.log('✅ dist/forgeui.js');
}

async function buildStandalone() {
  console.log('📦 Building standalone bundle (ESM, external deps)...');
  await build({
    ...sharedConfig,
    format: 'esm',
    outfile: 'dist/forgeui-standalone.js',
    external: ['lit', 'tinybase', 'ajv'],
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });
  console.log('✅ dist/forgeui-standalone.js');
}

async function buildCore() {
  console.log('📦 Building core (ESM, components only)...');
  await build({
    ...sharedConfig,
    format: 'esm',
    entryPoints: ['src/components/index.ts'],
    outfile: 'dist/forgeui-components.js',
    external: ['lit', 'tinybase'],
  });
  console.log('✅ dist/forgeui-components.js');
}

async function buildCatalog() {
  console.log('📦 Building catalog (ESM, schemas + prompts)...');
  await build({
    ...sharedConfig,
    format: 'esm',
    entryPoints: ['src/catalog/registry.ts'],
    outfile: 'dist/forgeui-catalog.js',
    external: ['zod'],
  });
  console.log('✅ dist/forgeui-catalog.js');
}

async function buildServer() {
  console.log('📦 Building server library (ESM, Hono + SQLite)...');
  await build({
    ...sharedConfig,
    format: 'esm',
    entryPoints: ['src/server/index.ts'],
    outfile: 'dist/forgeui-server.js',
    platform: 'node',
    target: 'node20',
    external: ['better-sqlite3'],
  });
  console.log('✅ dist/forgeui-server.js');
}

async function buildServerCli() {
  console.log('📦 Building server CLI runner...');
  await build({
    ...sharedConfig,
    format: 'esm',
    entryPoints: ['src/server/cli.ts'],
    outfile: 'dist/forgeui-cli.js',
    platform: 'node',
    target: 'node20',
    external: ['better-sqlite3'],
  });
  console.log('✅ dist/forgeui-cli.js');
}

async function buildConnect() {
  console.log('📦 Building MCP connector (ESM, stdio)...');
  await build({
    ...sharedConfig,
    format: 'esm',
    entryPoints: ['src/connect/index.ts'],
    outfile: 'dist/forgeui-connect.mjs',
    platform: 'node',
    target: 'node20',
    external: ['better-sqlite3'],
  });
  console.log('✅ dist/forgeui-connect.mjs');
}

async function buildCli() {
  console.log('📦 Building CLI (ESM, Node)...');
  await build({
    ...sharedConfig,
    format: 'esm',
    entryPoints: ['src/cli.ts'],
    outfile: 'dist/forgeui.mjs',
    platform: 'node',
    target: 'node20',
    external: ['better-sqlite3'],
  });
  console.log('✅ dist/forgeui.mjs');
}

async function buildTypes() {
  console.log('📦 Emitting type declarations...');
  const typeDir = 'dist/types';

  // Clean previous
  rmSync(typeDir, { recursive: true, force: true });

  // Emit all declarations from root tsconfig
  execSync('npx tsc --emitDeclarationOnly --outDir ' + typeDir, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  // @forgeui/runtime: copy full .d.ts tree (entry re-exports from siblings)
  for (const sub of ['runtime', 'state', 'validation', 'catalog', 'renderer', 'tokens', 'a2ui', 'components', 'types']) {
    execSync(`rsync -a --include='*/' --include='*.d.ts' --exclude='*' ${typeDir}/${sub}/ packages/runtime/${sub}/ 2>/dev/null || true`, { stdio: 'pipe' });
  }
  copyFileSync(`${typeDir}/index.d.ts`, 'packages/runtime/index.d.ts');
  copyFileSync(`${typeDir}/index.d.ts`, 'packages/runtime/forgeui-standalone.d.ts');

  // @forgeui/catalog: needs registry.d.ts + types/ for ComponentType references
  mkdirSync('packages/catalog/catalog', { recursive: true });
  mkdirSync('packages/catalog/types', { recursive: true });
  copyFileSync(`${typeDir}/catalog/registry.d.ts`, 'packages/catalog/catalog/registry.d.ts');
  copyFileSync(`${typeDir}/types/index.d.ts`, 'packages/catalog/types/index.d.ts');
  copyFileSync(`${typeDir}/catalog/registry.d.ts`, 'packages/catalog/forgeui-catalog.d.ts');

  // @forgeui/server: needs server/*.d.ts + types/ for ForgeUIManifest
  mkdirSync('packages/server/dist/server', { recursive: true });
  mkdirSync('packages/server/dist/types', { recursive: true });
  mkdirSync('packages/server/dist/validation', { recursive: true });
  execSync(`rsync -a --include='*/' --include='*.d.ts' --exclude='*' ${typeDir}/server/ packages/server/dist/server/`, { stdio: 'pipe' });
  copyFileSync(`${typeDir}/types/index.d.ts`, 'packages/server/dist/types/index.d.ts');
  execSync(`rsync -a --include='*/' --include='*.d.ts' --exclude='*' ${typeDir}/validation/ packages/server/dist/validation/ 2>/dev/null || true`, { stdio: 'pipe' });
  copyFileSync(`${typeDir}/server/index.d.ts`, 'packages/server/dist/forgeui-server.d.ts');

  console.log('✅ Type declarations emitted');
}

async function main() {
  switch (mode) {
    case 'artifact':
      await buildArtifact();
      break;
    case 'standalone':
      await buildStandalone();
      break;
    case 'server':
      await buildServer();
      break;
    case 'server-cli':
      await buildServerCli();
      break;
    case 'connect':
      await buildConnect();
      break;
    case 'cli':
      await buildCli();
      break;
    case 'types':
      await buildTypes();
      break;
    default:
      await buildArtifact();
      await buildStandalone();
      await buildCore();
      await buildCatalog();
      await buildServer();
      await buildServerCli();
      await buildConnect();
      await buildCli();
      await buildTypes();
      break;
  }

  // Report sizes
  const files = ['dist/forgeui.js', 'dist/forgeui-standalone.js', 'dist/forgeui-components.js', 'dist/forgeui-catalog.js', 'dist/forgeui-server.js', 'dist/forgeui-cli.js', 'dist/forgeui-connect.mjs', 'dist/forgeui.mjs'];
  console.log('\n📊 Bundle sizes:');
  for (const file of files) {
    try {
      const stat = statSync(file);
      const kb = (stat.size / 1024).toFixed(1);
      console.log(`  ${file}: ${kb} KB`);
    } catch {}
  }
  console.log(`\nBudget: 50 KB gzip for dist/forgeui.js (enforced via scripts/check-size.mjs).`);
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
