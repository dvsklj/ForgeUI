#!/usr/bin/env node
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { validateManifest } from '../src/validation/index.js';

const dir = 'examples';
const files = readdirSync(dir).filter(f => f.endsWith('.json'));
let failed = 0;

for (const file of files) {
  const path = join(dir, file);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(`✗ ${file}: invalid JSON — ${err.message}`);
    failed++;
    continue;
  }
  const result = validateManifest(manifest);
  if (!result.valid) {
    console.error(`✗ ${file}: ${result.errors.length} validation error(s)`);
    for (const e of result.errors) console.error(`   ${e.path}: ${e.message}`);
    failed++;
  } else {
    console.log(`✓ ${file}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} of ${files.length} example(s) failed validation.`);
  process.exit(1);
}
console.log(`\nAll ${files.length} examples validated.`);
