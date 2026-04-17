#!/usr/bin/env node

/**
 * scripts/bench-server.mjs
 *
 * Operator-facing sanity check — NOT a pass/fail gate.
 * Starts the Forge server on port 3456 (in-memory DB) and hammers it
 * with autocannon. Prints a results table at the end.
 *
 * Usage: node scripts/bench-server.mjs
 *        npm run bench:server
 */

import { createServer } from 'node:http';

let autocannon;
try {
  autocannon = (await import('autocannon')).default;
} catch {
  console.log('\n  ⏭️  autocannon not installed — skipping benchmark.');
  console.log('     Install with: npm install -D autocannon\n');
  process.exit(0);
}

// ── Dynamically import the server ───────────────────────────

process.env.FORGEUI_RATE_LIMIT_DISABLE = '1';
process.env.FORGEUI_MAX_BODY_BYTES = String(10 * 1024 * 1024);
process.env.FORGEUI_CORS_ORIGINS = '*';

const { createForgeUIServer } = await import('../src/server/index.js');
const { initDatabase, getDatabase } = await import('../src/server/db.js');

function rowCount() {
  return getDatabase().prepare('SELECT COUNT(*) as c FROM apps').get().c;
}

initDatabase(':memory:');
const { start, stop } = createForgeUIServer({
  port: 3456,
  host: '127.0.0.1',
  baseUrl: 'http://localhost:3456',
});

await start();
console.log('\n  🔥 Benchmark server running on http://127.0.0.1:3456\n');

// ── Small valid manifest for POST bench ─────────────────────

const smallManifest = JSON.stringify({
  manifest: '0.1.0',
  root: 'main',
  elements: { main: { type: 'Text', props: { content: 'Hello Benchmark' } } },
  meta: { title: 'Bench App' },
});

// ── Benchmarks ──────────────────────────────────────────────

const results = [];

async function run(label, opts) {
  process.stdout.write(`  ⏱️  ${label} ...`);
  const result = await autocannon(opts);
  results.push({ label, ...result });
  process.stdout.write(`\r  ✅ ${label} — ${result.requests.average} req/s avg, p99 latency ${result.latency.p99}ms\n`);
}

try {
  await run('GET /api/health', {
    url: 'http://127.0.0.1:3456/api/health',
    connections: 100,
    duration: 10,
    method: 'GET',
  });

  await run('GET /api/apps', {
    url: 'http://127.0.0.1:3456/api/apps',
    connections: 100,
    duration: 10,
    method: 'GET',
  });

  const prePostCount = rowCount();
  await run('POST /api/apps', {
    url: 'http://127.0.0.1:3456/api/apps',
    connections: 10,
    duration: 10,
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: smallManifest,
  });
  const postPostCount = rowCount();
  console.log(`  📊 DB rows before POST bench: ${prePostCount}, after: ${postPostCount}, delta: ${postPostCount - prePostCount}`);
} catch (err) {
  console.error('\n  ❌ Benchmark error:', err.message);
}

// ── Print results table ─────────────────────────────────────

console.log('\n  ┌────────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐');
console.log('  │ Scenario               │ Avg rps  │ p50 (ms) │ p99 (ms) │ Max (ms) │ Total    │');
console.log('  ├────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤');

for (const r of results) {
  const label = r.label.padEnd(22);
  const avg = String(r.requests.average).padStart(8);
  const p50 = String(r.latency.p50).padStart(8);
  const p99 = String(r.latency.p99).padStart(8);
  const max = String(r.latency.max).padStart(8);
  const total = String(r.requests.total).padStart(8);
  console.log(`  │ ${label} │ ${avg} │ ${p50} │ ${p99} │ ${max} │ ${total} │`);
}

console.log('  └────────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘');

// ── Sanity checks (informational, not gate) ─────────────────

const health = results.find((r) => r.label.includes('health'));
const apps = results.find((r) => r.label.includes('GET /api/apps'));
const post = results.find((r) => r.label.includes('POST'));

console.log('');
if (health) {
  const ok = health.requests.average >= 5000;
  console.log(`  ${ok ? '✅' : '⚠️'} GET /api/health: ${health.requests.average} rps (target >5000)`);
}
if (apps) {
  const ok = apps.requests.average >= 2000;
  console.log(`  ${ok ? '✅' : '⚠️'} GET /api/apps:  ${apps.requests.average} rps (target >2000)`);
}
if (post) {
  const ok = post.requests.average >= 500;
  console.log(`  ${ok ? '✅' : '⚠️'} POST /api/apps: ${post.requests.average} rps (target >500)`);
}
console.log('');

// ── Cleanup ─────────────────────────────────────────────────

stop();
console.log('  🛑 Server stopped.\n');
