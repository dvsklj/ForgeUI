#!/usr/bin/env node

/**
 * Forge CLI
 *
 * Commands:
 *   forge serve                        Start the Forge Server
 *   forge deploy <manifest.json>       Deploy a manifest to the server
 *   forge validate <manifest.json>     Validate a manifest file
 *   forge catalog                      Show component catalog
 *   forge connect                      Start the MCP connector (stdio)
 *   forge dev                          Start dev server with file watching
 *
 * Options:
 *   --port <port>        Server port (default: 3000)
 *   --host <host>        Server host (default: 0.0.0.0)
 *   --db <path>          Database path (default: ./forge.db)
 *   --server <url>       Server URL for deploy (default: http://localhost:3000)
 *   --json               Output as JSON
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
const command = args[0];

function getFlag(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

function getFlagBool(name: string): boolean {
  return args.includes(`--${name}`);
}

async function main() {
  switch (command) {
    case 'serve':
      await cmdServe();
      break;
    case 'deploy':
      await cmdDeploy();
      break;
    case 'validate':
      cmdValidate();
      break;
    case 'catalog':
      cmdCatalog();
      break;
    case 'connect':
      await cmdConnect();
      break;
    case 'dev':
      await cmdDev();
      break;
    case 'help':
    case undefined:
      printHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

// ─── forge serve ────────────────────────────────────────────

async function cmdServe() {
  const { createForgeServer } = await import('./server/index.js');

  const port = parseInt(getFlag('port') || '3000');
  const host = getFlag('host') || '0.0.0.0';
  const dbPath = getFlag('db') || './forge.db';

  const server = createForgeServer({ port, host, dbPath });
  process.on('SIGINT', () => { server.stop(); process.exit(0); });
  process.on('SIGTERM', () => { server.stop(); process.exit(0); });
  await server.start();
}

// ─── forge deploy ───────────────────────────────────────────

async function cmdDeploy() {
  const file = args[1];
  if (!file) {
    console.error('Usage: forge deploy <manifest.json>');
    process.exit(1);
  }

  const path = resolve(file);
  if (!existsSync(path)) {
    console.error(`File not found: ${path}`);
    process.exit(1);
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err: any) {
    console.error(`Invalid JSON: ${err.message}`);
    process.exit(1);
  }

  // Validate
  const { validateManifest } = await import('./validation/index.js');
  const validation = validateManifest(manifest);

  if (!validation.valid) {
    console.error('Validation failed:');
    for (const error of validation.errors) {
      console.error(`  ❌ ${error.path}: ${error.message}`);
    }
    process.exit(1);
  }

  if (validation.warnings.length > 0) {
    console.warn('Warnings:');
    for (const warning of validation.warnings) {
      console.warn(`  ⚠️ ${warning.path}: ${warning.message}`);
    }
  }

  // Deploy to server
  const serverUrl = getFlag('server') || 'http://localhost:3000';
  const url = `${serverUrl}/api/apps`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manifest),
    });

    if (!res.ok) {
      const err = await res.json() as any;
      console.error(`Deploy failed: ${err.error || res.statusText}`);
      process.exit(1);
    }

    const result = await res.json() as any;
    console.log(`✅ Deployed: ${result.title}`);
    console.log(`   ID: ${result.id}`);
    console.log(`   URL: ${result.url}`);

    if (getFlagBool('json')) {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (err: any) {
    console.error(`Failed to connect to server at ${serverUrl}: ${err.message}`);
    console.error('Is the server running? Start it with: forge serve');
    process.exit(1);
  }
}

// ─── forge validate ─────────────────────────────────────────

async function cmdValidate() {
  const file = args[1];
  if (!file) {
    console.error('Usage: forge validate <manifest.json>');
    process.exit(1);
  }

  const path = resolve(file);
  if (!existsSync(path)) {
    console.error(`File not found: ${path}`);
    process.exit(1);
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err: any) {
    console.error(`Invalid JSON: ${err.message}`);
    process.exit(1);
  }

  const { validateManifest } = await import('./validation/index.js');
  const result = validateManifest(manifest);

  if (result.valid) {
    console.log('✅ Manifest is valid');
    if (result.warnings.length > 0) {
      console.log(`   ${result.warnings.length} warning(s):`);
      for (const w of result.warnings) {
        console.log(`   ⚠️ ${w.path}: ${w.message}`);
      }
    }
  } else {
    console.log('❌ Manifest is invalid');
    console.log(`   ${result.errors.length} error(s):`);
    for (const e of result.errors) {
      console.log(`   ❌ ${e.path}: ${e.message}`);
    }
    if (result.warnings.length > 0) {
      console.log(`   ${result.warnings.length} warning(s):`);
      for (const w of result.warnings) {
        console.log(`   ⚠️ ${w.path}: ${w.message}`);
      }
    }
    process.exit(1);
  }

  if (getFlagBool('json')) {
    console.log(JSON.stringify(result, null, 2));
  }
}

// ─── forge catalog ──────────────────────────────────────────

async function cmdCatalog() {
  const tier = (getFlag('tier') as any) || 'full';
  const { catalogPrompt, catalogToJsonSchema } = await import('./catalog/registry.js');

  if (getFlagBool('json')) {
    const schema = catalogToJsonSchema();
    console.log(JSON.stringify(schema, null, 2));
  } else {
    const prompt = catalogPrompt(tier);
    console.log(prompt);
  }
}

// ─── forge connect ──────────────────────────────────────────

async function cmdConnect() {
  const dbPath = getFlag('db') || './forge.db';
  process.env.FORGE_DB_PATH = dbPath;

  // Import and run the connect server
  await import('./connect/index.js');
  // The connect module auto-starts via its main() function
}

// ─── forge dev ──────────────────────────────────────────────

async function cmdDev() {
  console.log('🔨 Starting Forge dev server...\n');

  const port = parseInt(getFlag('port') || '3000');
  const host = getFlag('host') || '0.0.0.0';
  const dbPath = getFlag('db') || './forge.db';

  // Import build to do initial build
  const { createForgeServer } = await import('./server/index.js');

  const server = createForgeServer({ port, host, dbPath });
  process.on('SIGINT', () => { server.stop(); process.exit(0); });
  process.on('SIGTERM', () => { server.stop(); process.exit(0); });
  await server.start();

  console.log('\n📁 Watching for changes... (Ctrl+C to stop)');
  console.log('   Edit manifests via the API and refresh the browser.\n');
}

// ─── Help ───────────────────────────────────────────────────

function printHelp() {
  console.log(`
🔥 Forge CLI — Dynamic web app platform

Usage: forge <command> [options]

Commands:
  serve                        Start the Forge Server
  deploy <manifest.json>       Deploy a manifest to the server
  validate <manifest.json>     Validate a manifest file
  catalog                      Show component catalog
  connect                      Start the MCP connector (stdio)
  dev                          Start dev server
  help                         Show this help

Options:
  --port <port>        Server port (default: 3000)
  --host <host>        Server host (default: 0.0.0.0)
  --db <path>          Database path (default: ./forge.db)
  --server <url>       Server URL for deploy (default: http://localhost:3000)
  --tier <level>       Catalog detail: minimal|default|full
  --json               Output as JSON

Examples:
  forge serve --port 3000
  forge deploy ./my-app.json
  forge validate ./my-app.json
  forge catalog --tier full --json
  forge connect --db ./apps.db
  forge dev --port 8080
`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
