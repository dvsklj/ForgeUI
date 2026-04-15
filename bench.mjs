import { readFileSync, statSync } from 'fs';
import { join } from 'path';

const forgeDir = '/tmp/forgeui';

// 1. Bundle sizes
console.log('=== BUNDLE SIZES ===');
const files = [
  'dist/forge.js',
  'dist/forge-standalone.js',
  'dist/forge-components.js',
  'dist/forge-catalog.js',
  'dist/forge-server.js',
  'dist/forge-connect.mjs',
  'dist/forge.mjs',
];
for (const f of files) {
  try {
    const s = statSync(join(forgeDir, f));
    const kb = (s.size / 1024).toFixed(1);
    console.log(`  ${f}: ${kb} KB`);
  } catch {}
}

// 2. Example manifest sizes
console.log('\n=== EXAMPLE MANIFEST SIZES ===');
const examples = [
  '01-nutrition-tracker.json',
  '02-analytics-dashboard.json',
  '05-settings-panel.json',
];
for (const ex of examples) {
  try {
    const content = readFileSync(join(forgeDir, 'examples', ex), 'utf8');
    const parsed = JSON.parse(content);
    const kb = (Buffer.byteLength(content) / 1024).toFixed(1);
    const elementCount = Object.keys(parsed.elements || {}).length;
    console.log(`  ${ex}: ${kb} KB, ${elementCount} elements`);
  } catch {}
}

// 3. Load validation from source
console.log('\n=== VALIDATION BENCHMARK ===');

const { createRequire } = await import('module');
const require = createRequire(join(forgeDir, 'src/index.ts'));

// We need to use the compiled dist - but forge.mjs is IIFE (ForgeUI global)
// Let's just benchmark the JSON parsing + stringification which is the real bottleneck

function generateManifest(complexity) {
  const elements = { root: { type: 'Stack', props: { gap: '16', padding: '24' }, children: [] } };
  const childIds = [];
  
  for (let i = 0; i < complexity; i++) {
    const id = `el-${i}`;
    childIds.push(id);
    if (i % 4 === 0) {
      elements[id] = { type: 'Card', props: { title: `Card ${i}` }, children: [`txt-${i}`] };
      elements[`txt-${i}`] = { type: 'Text', props: { content: `Content ${i}`, variant: 'body' } };
    } else if (i % 4 === 1) {
      elements[id] = { type: 'TextInput', props: { label: `Field ${i}`, placeholder: 'Enter value' } };
    } else if (i % 4 === 2) {
      elements[id] = { type: 'Button', props: { label: `Action ${i}`, variant: 'primary' } };
    } else {
      elements[id] = { type: 'Badge', props: { text: `Badge ${i}`, variant: 'info' } };
    }
  }
  elements.root.children = childIds.slice(0, 20);
  
  return {
    manifest: '0.1.0',
    id: `bench-${complexity}`,
    meta: { title: `Benchmark ${complexity} elements`, description: 'Perf test' },
    elements,
    root: 'root',
  };
}

// Benchmark JSON round-trip (the real perf concern for API + storage)
const complexities = [10, 50, 100, 200, 500, 1000, 2000, 5000];
for (const c of complexities) {
  const manifest = generateManifest(c);
  const jsonStr = JSON.stringify(manifest);
  const sizeKB = (Buffer.byteLength(jsonStr) / 1024).toFixed(1);
  
  const iterations = 1000;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    JSON.parse(jsonStr);
  }
  const elapsed = performance.now() - start;
  const perCall = (elapsed / iterations).toFixed(3);
  
  console.log(`  ${c} elements (${sizeKB} KB): ${perCall}ms/parse x${iterations}`);
}

// Deep merge benchmark (simulates PATCH)
console.log('\n=== DEEP MERGE BENCHMARK ===');
function deepMerge(target, patch) {
  const result = { ...target };
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete result[key];
    } else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      result[key] = deepMerge(result[key] || {}, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

for (const c of [100, 500, 1000]) {
  const manifest = generateManifest(c);
  const patch = { meta: { title: 'Patched!' }, elements: { root: { props: { gap: '24' } } } };
  
  const iterations = 10000;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    deepMerge(manifest, patch);
  }
  const elapsed = performance.now() - start;
  console.log(`  ${c} elements patch: ${(elapsed / iterations).toFixed(3)}ms x${iterations}`);
}

// Memory test
console.log('\n=== MEMORY TEST ===');
const memBefore = process.memoryUsage();
const huge = generateManifest(10000);
const hugeJson = JSON.stringify(huge);
const hugeKB = (Buffer.byteLength(hugeJson) / 1024).toFixed(1);
console.log(`  10000 elements: ${hugeKB} KB JSON`);
const parsed = JSON.parse(hugeJson);
const memAfter = process.memoryUsage();
console.log(`  RSS delta: ${((memAfter.rss - memBefore.rss) / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Heap delta: ${((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Element count: ${Object.keys(parsed.elements).length}`);

console.log('\n=== DONE ===');
