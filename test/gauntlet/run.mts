#!/usr/bin/env node
/**
 * gauntlet/run.mjs — LLM manifest generation harness
 *
 * For each of 50 archetypes, calls Claude to generate a Forge manifest,
 * validates it, renders it in Playwright, and scores the result.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npm run gauntlet
 *   ANTHROPIC_API_KEY=sk-... npm run gauntlet -- --archetype analytics-dashboard
 *   ANTHROPIC_API_KEY=sk-... npm run gauntlet -- --keep-existing
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ─── Config ────────────────────────────────────────────────

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');
const GAUNTLET_DIR = join(ROOT, 'test', 'gauntlet');
const ARCHETYPES_FILE = join(GAUNTLET_DIR, 'archetypes.json');
const OUTPUTS_DIR = join(GAUNTLET_DIR, 'outputs');
const MODEL = 'claude-sonnet-4-5';
const CONCURRENCY = 2;
const RENDER_TIMEOUT = 5000;

// ─── CLI args ──────────────────────────────────────────────

const args = process.argv.slice(2);
const singleArchetype = args.includes('--archetype') ? args[args.indexOf('--archetype') + 1] : null;
const keepExisting = args.includes('--keep-existing');

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY is not set. Export it before running:\n   export ANTHROPIC_API_KEY=sk-ant-...');
  process.exit(1);
}

// ─── Helpers ───────────────────────────────────────────────

function section(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(60)}`);
}

/** Call Claude API and return the text response. Retries on 429. */
async function callClaude(systemPrompt, userMessage) {
  const maxRetries = 5;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.content[0].text;
    }

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '5', 10);
      const wait = Math.min(retryAfter * 1000 || (2 ** attempt) * 3000, 60000);
      console.log(`  ⏳ Rate limited, waiting ${(wait / 1000).toFixed(0)}s (attempt ${attempt + 1}/${maxRetries})...`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }

    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err.slice(0, 500)}`);
  }
  throw new Error(`Claude API: max retries (${maxRetries}) exceeded`);
}

/** Attempt to extract JSON from LLM output (strip code fences, prose) */
function unwrapJson(text) {
  const trimmed = text.trim();
  // Direct JSON
  try {
    const parsed = JSON.parse(trimmed);
    return { json: parsed, wrapped: false };
  } catch {}

  // Code fence
  const fenced = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenced) {
    try {
      const parsed = JSON.parse(fenced[1].trim());
      return { json: parsed, wrapped: true };
    } catch {}
  }

  // Find first { ... last }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const parsed = JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
      return { json: parsed, wrapped: true };
    } catch {}
  }

  return { json: null, wrapped: true };
}

/** Check if a screenshot is non-degenerate (not blank/monochrome) */
function isNonDegenerate(screenshotPath) {
  try {
    const buf = readFileSync(screenshotPath);
    // PNG minimum meaningful size: ~10KB for a real page
    if (buf.length < 5000) return false;

    // Simple heuristic: check byte diversity in the compressed stream
    // A blank/monochrome image compresses to very few unique bytes
    const sample = buf.slice(Math.min(100, buf.length), Math.min(10100, buf.length));
    const unique = new Set(sample);
    // Real pages have high byte diversity; monochrome PNGs have low diversity
    return unique.size > 50;
  } catch {
    return false;
  }
}

// ─── Load catalog prompt ───────────────────────────────────

// Import from source — the gauntlet runs in the repo, not from a tarball
const { catalogPrompt } = await import(join(ROOT, 'src', 'catalog', 'prompt.ts'));
const { validateManifest } = await import(join(ROOT, 'src', 'validation', 'index.ts'));

const SYSTEM_PROMPT = catalogPrompt('full');

const ARCHETYPES = JSON.parse(readFileSync(ARCHETYPES_FILE, 'utf8'));

// ─── Run a single archetype ────────────────────────────────

async function runArchetype(archetype) {
  const { id, brief } = archetype;
  const outDir = join(OUTPUTS_DIR, id);
  mkdirSync(outDir, { recursive: true });

  const result = { id, parse: false, validate: false, render: false, nonDegenerate: false, errors: [] };

  // Step 1: LLM call
  const userMessage = `Generate a Forge UI manifest JSON for this app: ${brief}\n\nRespond with ONLY the JSON object. No explanation, no markdown fences.`;

  let rawText;
  try {
    rawText = await callClaude(SYSTEM_PROMPT, userMessage);
    writeFileSync(join(outDir, 'manifest.json'), rawText);
  } catch (err) {
    result.errors.push(`API call failed: ${err.message}`);
    writeFileSync(join(outDir, 'manifest.json'), '');
    writeFileSync(join(outDir, 'validation.json'), JSON.stringify({ errors: result.errors }, null, 2));
    return result;
  }

  // Step 2: Parse
  const { json: parsed, wrapped } = unwrapJson(rawText);
  if (!parsed) {
    result.errors.push('Failed to parse JSON from LLM output');
    writeFileSync(join(outDir, 'manifest.parsed.json'), '');
    writeFileSync(join(outDir, 'validation.json'), JSON.stringify({ errors: result.errors }, null, 2));
    return result;
  }

  result.parse = true;
  if (wrapped) result.errors.push('Needed unwrapping (code fence or prose around JSON)');
  writeFileSync(join(outDir, 'manifest.parsed.json'), JSON.stringify(parsed, null, 2));

  // Step 3: Validate
  const validation = validateManifest(parsed);
  writeFileSync(join(outDir, 'validation.json'), JSON.stringify({
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
  }, null, 2));

  if (!validation.valid) {
    result.errors.push(...validation.errors.map(e => `${e.path}: ${e.message}`));
    return result;
  }
  result.validate = true;

  // Step 4+5: Render and check (done by the Playwright harness)
  // These are marked false here; the harness updates them
  return result;
}

// ─── Playwright rendering harness ──────────────────────────

async function renderWithPlaywright(validArchetypes) {
  if (validArchetypes.length === 0) return;

  // Launch a simple HTTP server for the harness
  const server = spawn('npx', ['serve', '-p', '9876', '.'], {
    cwd: ROOT,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Wait for server to be ready
  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch('http://localhost:9876/test/e2e/harness.html');
      if (res.ok) { serverReady = true; break; }
    } catch {}
  }
  if (!serverReady) {
    console.error('  ❌ Server failed to start on port 9876');
    server.kill('SIGTERM');
    return;
  }

  let browser;
  try {
    // Import playwright dynamically
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    for (const arch of validArchetypes) {
      const outDir = join(OUTPUTS_DIR, arch.id);
      const manifestPath = join(outDir, 'manifest.parsed.json');
      if (!existsSync(manifestPath)) continue;

      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const consoleLogs = [];

      page.on('console', msg => {
        consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
      });
      page.on('pageerror', err => {
        consoleLogs.push(`[pageerror] ${err.message}`);
      });

      try {
        await page.goto('http://localhost:9876/test/e2e/harness.html', { timeout: 10000 });
        await page.waitForFunction(() => !!document.getElementById('app'), { timeout: 5000 });

        // Set the manifest
        await page.evaluate((m) => {
          document.getElementById('app').manifest = m;
        }, manifest);

        // Wait for render or timeout
        try {
          await page.waitForFunction(() => {
            const app = document.getElementById('app');
            if (!app) return false;
            const sr = app.shadowRoot;
            if (sr && sr.children.length > 0) return true;
            if (app.children.length > 0) return true;
            return false;
          }, { timeout: RENDER_TIMEOUT });
          arch.render = true;
        } catch {
          arch.errors.push('Render timeout: no content appeared within 5s');
        }

        // Check for error elements
        const hasErrors = await page.evaluate(() => {
          const app = document.getElementById('app');
          const container = app?.shadowRoot || app;
          if (!container) return true;
          const errorElements = container.querySelectorAll('forgeui-error');
          const allElements = container.querySelectorAll('*');
          // Degenerate if only error elements or no content
          return errorElements.length > 0 && errorElements.length >= allElements.length;
        });

        if (hasErrors) {
          arch.errors.push('Only forgeui-error elements rendered');
        }

        // Screenshot
        await page.screenshot({ path: join(outDir, 'screenshot.png'), fullPage: true });

        // Non-degenerate check
        arch.nonDegenerate = isNonDegenerate(join(outDir, 'screenshot.png')) && !hasErrors;

        // Save console log
        writeFileSync(join(outDir, 'console.log'), consoleLogs.join('\n'));

      } catch (err) {
        arch.errors.push(`Playwright error: ${err.message}`);
        writeFileSync(join(outDir, 'console.log'), consoleLogs.join('\n'));
      }

      // Clear listeners for next archetype
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
    }

    await browser.close();
  } finally {
    server.kill('SIGTERM');
  }
}

// ─── Generate report ───────────────────────────────────────

function generateReport(results) {
  const lines = [];
  lines.push('# Gauntlet Report');
  lines.push('');
  lines.push(`**Model:** ${MODEL}`);
  lines.push(`**Archetypes:** ${results.length}`);
  lines.push(`**Date:** ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Archetype | Parse | Validate | Render | Non-degenerate |');
  lines.push('|-----------|-------|----------|--------|----------------|');

  const counts = { parse: 0, validate: 0, render: 0, nonDegenerate: 0 };

  for (const r of results) {
    const p = r.parse ? '✓' : '✗';
    const v = r.validate ? '✓' : '✗';
    const rd = r.render ? '✓' : '✗';
    const nd = r.nonDegenerate ? '✓' : '✗';
    lines.push(`| ${r.id} | ${p} | ${v} | ${rd} | ${nd} |`);
    if (r.parse) counts.parse++;
    if (r.validate) counts.validate++;
    if (r.render) counts.render++;
    if (r.nonDegenerate) counts.nonDegenerate++;
  }

  const n = results.length;
  lines.push('');
  lines.push('## Pass Rates');
  lines.push('');
  lines.push(`| Stage | Passed | Rate |`);
  lines.push(`|-------|--------|------|`);
  lines.push(`| Parse | ${counts.parse}/${n} | ${(counts.parse / n * 100).toFixed(0)}% |`);
  lines.push(`| Validate | ${counts.validate}/${n} | ${(counts.validate / n * 100).toFixed(0)}% |`);
  lines.push(`| Render | ${counts.render}/${n} | ${(counts.render / n * 100).toFixed(0)}% |`);
  lines.push(`| Non-degenerate | ${counts.nonDegenerate}/${n} | ${(counts.nonDegenerate / n * 100).toFixed(0)}% |`);

  // Failure clusters
  lines.push('');
  lines.push('## Failure Clusters');
  lines.push('');

  const clusters = new Map(); // errorPattern -> archetype ids
  for (const r of results) {
    for (const err of r.errors) {
      // Normalize error to find clusters
      const normalized = err
        .replace(/\/elements\/[^/]+\//g, '/elements/*/')
        .replace(/at \/[^:]+:/g, 'at /*:')
        .slice(0, 120);

      if (!clusters.has(normalized)) clusters.set(normalized, []);
      clusters.get(normalized).push(r.id);
    }
  }

  // Sort by frequency
  const sorted = [...clusters.entries()].sort((a, b) => b[1].length - a[1].length);

  let clusterIdx = 0;
  for (const [pattern, archetypes] of sorted) {
    if (clusterIdx >= 15) break; // Top 15 clusters
    if (archetypes.length < 1 && clusterIdx >= 5) continue; // Only show frequent ones after top 5
    lines.push(`### Cluster ${clusterIdx + 1} (${archetypes.length} archetype${archetypes.length > 1 ? 's' : ''})`);
    lines.push('');
    lines.push(`**Pattern:** \`${pattern}\``);
    lines.push('');
    lines.push(`**Affected:** ${archetypes.join(', ')}`);
    lines.push('');
    clusterIdx++;
  }

  // Observations
  lines.push('');
  lines.push('## Observations');
  lines.push('');

  for (const r of results) {
    if (r.parse && r.validate && r.render && r.nonDegenerate && r.errors.length > 0) {
      lines.push(`- **${r.id}**: ${r.errors.join('; ')}`);
    }
  }

  if (lines[lines.length - 1] === '') lines.pop(); // trailing blank

  return lines.join('\n');
}

// ─── Main ──────────────────────────────────────────────────

async function main() {
  section('Forge Gauntlet — LLM Manifest Generation');

  let archetypes = ARCHETYPES;
  if (singleArchetype) {
    archetypes = ARCHETYPES.filter(a => a.id === singleArchetype);
    if (archetypes.length === 0) {
      console.error(`❌ Unknown archetype: ${singleArchetype}`);
      console.error(`Available: ${ARCHETYPES.map(a => a.id).join(', ')}`);
      process.exit(1);
    }
  }

  console.log(`Archetypes: ${archetypes.length}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Output: ${OUTPUTS_DIR}`);

  mkdirSync(OUTPUTS_DIR, { recursive: true });

  // Filter out already-completed if --keep-existing
  if (keepExisting) {
    const before = archetypes.length;
    archetypes = archetypes.filter(a => {
      const parsedFile = join(OUTPUTS_DIR, a.id, 'manifest.parsed.json');
      const valFile = join(OUTPUTS_DIR, a.id, 'validation.json');
      const screenshotFile = join(OUTPUTS_DIR, a.id, 'screenshot.png');
      // Keep (run) if any output file is missing
      if (!existsSync(parsedFile) || !existsSync(valFile) || !existsSync(screenshotFile)) return true;
      try {
        const val = JSON.parse(readFileSync(valFile, 'utf8'));
        // Keep (run) if API failed — should be retried
        if (val.errors?.some(e => e.startsWith('API call failed'))) return true;
        // Skip — already completed successfully
        return false;
      } catch { return true; }
    });
    console.log(`Skipping ${before - archetypes.length} already-completed archetypes`);
  }

  if (archetypes.length === 0) {
    console.log('Nothing to run (all completed). Use without --keep-existing to rerun.');
    process.exit(0);
  }

  // Phase 1: LLM calls (concurrent)
  section('Phase 1: LLM Generation');

  const results = [];
  for (let i = 0; i < archetypes.length; i += CONCURRENCY) {
    const batch = archetypes.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(archetypes.length / CONCURRENCY);
    console.log(`\nBatch ${batchNum}/${totalBatches}: ${batch.map(a => a.id).join(', ')}`);

    const batchResults = await Promise.all(batch.map(a => runArchetype(a)));
    results.push(...batchResults);

    for (const r of batchResults) {
      const status = r.validate ? '✅ valid' : r.parse ? '⚠️ invalid' : '❌ parse fail';
      console.log(`  ${r.id}: ${status}${r.errors.length ? ' — ' + r.errors[0].slice(0, 80) : ''}`);
    }
  }

  // Phase 2: Playwright rendering (serial)
  section('Phase 2: Rendering');

  const validArchetypes = results.filter(r => r.validate);
  console.log(`Rendering ${validArchetypes.length} valid manifests...`);

  if (validArchetypes.length > 0) {
    await renderWithPlaywright(validArchetypes);
  }

  for (const r of validArchetypes) {
    const status = r.nonDegenerate ? '✅ rendered' : '⚠️ degenerate';
    console.log(`  ${r.id}: ${status}${r.errors.length ? ' — ' + r.errors[r.errors.length - 1].slice(0, 80) : ''}`);
  }

  // Phase 3: Report — always generate from ALL output dirs, not just this run
  section('Phase 3: Report');

  // Collect results from all output directories
  const allResults = [];
  const allDirs = readdirSync(OUTPUTS_DIR).filter(d => {
    return existsSync(join(OUTPUTS_DIR, d, 'validation.json'));
  });
  for (const dir of allDirs) {
    const valPath = join(OUTPUTS_DIR, dir, 'validation.json');
    const val = JSON.parse(readFileSync(valPath, 'utf8'));
    const parsedExists = existsSync(join(OUTPUTS_DIR, dir, 'manifest.parsed.json'));
    const screenshotExists = existsSync(join(OUTPUTS_DIR, dir, 'screenshot.png'));

    // Find this archetype's result from this run's results
    const fromRun = results.find(r => r.id === dir);
    if (fromRun) {
      allResults.push(fromRun);
    } else {
      // Reconstruct from files
      const errors = val.errors || [];
      const parse = parsedExists && !errors.some(e => e === 'Failed to parse JSON from LLM output');
      const validate = val.valid === true;
      const render = screenshotExists && parse && validate;
      const nonDegenerate = render && isNonDegenerate(join(OUTPUTS_DIR, dir, 'screenshot.png'));
      allResults.push({ id: dir, parse, validate, render, nonDegenerate, errors });
    }
  }

  // Sort by archetypes.json order
  const orderMap = new Map(ARCHETYPES.map((a, i) => [a.id, i]));
  allResults.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));

  const report = generateReport(allResults);
  const reportPath = join(OUTPUTS_DIR, 'report.md');
  writeFileSync(reportPath, report);
  console.log(`Report written to ${reportPath}`);

  // Print summary
  const n = allResults.length;
  const parseRate = allResults.filter(r => r.parse).length;
  const validRate = allResults.filter(r => r.validate).length;
  const renderRate = allResults.filter(r => r.render).length;
  const ndRate = allResults.filter(r => r.nonDegenerate).length;

  console.log(`\nPass rates (across all ${n} archetypes):`);
  console.log(`  Parse:          ${parseRate}/${n} (${(parseRate/n*100).toFixed(0)}%)`);
  console.log(`  Validate:       ${validRate}/${n} (${(validRate/n*100).toFixed(0)}%)`);
  console.log(`  Render:         ${renderRate}/${n} (${(renderRate/n*100).toFixed(0)}%)`);
  console.log(`  Non-degenerate: ${ndRate}/${n} (${(ndRate/n*100).toFixed(0)}%)`);

  console.log('\n✅ Gauntlet complete');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
