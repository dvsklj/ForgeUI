/**
 * Forge Build Script
 * 
 * Bundles the runtime using esbuild. Two modes:
 * - artifact: inline everything (Lit + TinyBase + Ajv + all components)
 * - standalone: external deps from CDN (smaller, needs network)
 */

import { build, context } from 'esbuild';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const mode = process.argv.includes('--mode=artifact') ? 'artifact'
           : process.argv.includes('--mode=standalone') ? 'standalone'
           : 'all';

const isDev = process.argv.includes('--dev');

const sharedConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: !isDev,
  target: 'es2020',
  format: 'esm',
  sourcemap: isDev,
  legalComments: 'none',
  treeShaking: true,
};

async function buildArtifact() {
  console.log('📦 Building artifact bundle (all inline)...');
  await build({
    ...sharedConfig,
    outfile: 'dist/forge.js',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    // Inline everything for zero-dependency artifact mode
    external: [],
  });
  console.log('✅ dist/forge.js');
}

async function buildStandalone() {
  console.log('📦 Building standalone bundle (external deps)...');
  await build({
    ...sharedConfig,
    outfile: 'dist/forge-standalone.js',
    external: ['lit', 'tinybase', 'ajv'],
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });
  console.log('✅ dist/forge-standalone.js');
}

async function buildCore() {
  console.log('📦 Building core (components only, no deps)...');
  await build({
    ...sharedConfig,
    entryPoints: ['src/components/index.ts'],
    outfile: 'dist/forge-components.js',
    external: ['lit', 'tinybase'],
  });
  console.log('✅ dist/forge-components.js');
}

async function buildCatalog() {
  console.log('📦 Building catalog (schemas only)...');
  await build({
    ...sharedConfig,
    entryPoints: ['src/catalog/schemas/index.ts'],
    outfile: 'dist/forge-catalog.js',
    external: ['zod'],
  });
  console.log('✅ dist/forge-catalog.js');
}

async function main() {
  switch (mode) {
    case 'artifact':
      await buildArtifact();
      break;
    case 'standalone':
      await buildStandalone();
      break;
    default:
      await buildArtifact();
      await buildStandalone();
      await buildCore();
      await buildCatalog();
      break;
  }

  // Report sizes
  const { statSync } = await import('fs');
  const files = ['dist/forge.js', 'dist/forge-standalone.js', 'dist/forge-components.js', 'dist/forge-catalog.js'];
  console.log('\n📊 Bundle sizes:');
  for (const file of files) {
    try {
      const stat = statSync(file);
      const kb = (stat.size / 1024).toFixed(1);
      console.log(`  ${file}: ${kb} KB`);
    } catch {}
  }
  console.log('\nTarget: ~40KB gzip for forge.js (full artifact bundle)');
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
