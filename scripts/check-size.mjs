#!/usr/bin/env node
// Size budget gate for dist/forge.js (IIFE bundle).
// Assumes `npm run build` has already run and dist/forge.js exists.

import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET_BYTES = 50_000; // ~47 KB gzip after Ajv standalone precompile. Ratchet down further as needed.

const path = 'dist/forge.js';
let raw;
try {
  raw = readFileSync(path);
} catch (e) {
  console.error(`[size] ${path} not found — did \`npm run build\` run first?`);
  process.exit(2);
}

const rawBytes = statSync(path).size;
const gzippedBytes = gzipSync(raw).length;

const pct = ((gzippedBytes / BUDGET_BYTES) * 100).toFixed(1);
console.log(`[size] ${path}`);
console.log(`[size]   raw    : ${rawBytes.toLocaleString()} bytes`);
console.log(`[size]   gzip   : ${gzippedBytes.toLocaleString()} bytes`);
console.log(`[size]   budget : ${BUDGET_BYTES.toLocaleString()} bytes (${pct}% used)`);

if (gzippedBytes > BUDGET_BYTES) {
  console.error(`[size] FAIL: gzip size ${gzippedBytes} exceeds budget ${BUDGET_BYTES}.`);
  console.error(`[size] If this increase is intentional, raise BUDGET_BYTES in scripts/check-size.mjs.`);
  process.exit(1);
}
console.log(`[size] OK`);
