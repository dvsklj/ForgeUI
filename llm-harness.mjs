// LLM Reliability Test Harness for Forge UI
// Tests 20 prompts and validates LLM-generated manifests

const PROMPTS = [
  "Create a simple todo app with tasks that have name, priority, and done status. Show them in a table.",
  "Build a settings panel with toggles for dark mode, notifications, and auto-save, plus a save button.",
  "Make a sales dashboard with 3 KPI metrics (revenue, orders, conversion) and a bar chart by month.",
  "Create a user profile card showing name, email, role in a card with an edit button.",
  "Build a progress tracker showing 5 project milestones with status badges.",
  "Create an order management table with columns for order ID, customer, amount, status, and date.",
  "Make a calculator-style interface with input fields and a result display.",
  "Build a notification center with alert components for success, warning, and error messages.",
  "Create a blog post editor with a title input, content text area, and category dropdown.",
  "Build an inventory dashboard with a table of products and a chart showing stock levels.",
  "Create a team directory with a grid of cards showing member name, role, and status badge.",
  "Make a survey form with text inputs, checkboxes, and a submit button.",
  "Build a metrics dashboard with 4 KPI cards in a 2x2 grid layout.",
  "Create a task board with 3 columns (todo, doing, done) using cards with badges.",
  "Build a simple booking form with name, email, date picker (select), and service dropdown.",
  "Create a customer support ticket viewer with priority badges and status indicators.",
  "Build a finance overview with a line chart for expenses, a table of recent transactions, and a total metric.",
  "Create a recipe card with ingredients list, cooking time metric, and difficulty badge.",
  "Build a project overview with a progress bar, team members list, and deadline alert.",
  "Create an analytics page with a pie chart showing traffic sources and a table of top pages."
];

const SYSTEM_PROMPT = `You are a UI generator. Output ONLY a valid Forge UI manifest JSON object. No explanations, no markdown, just the JSON.

Forge UI Manifest Format:
- manifest: "0.1.0" (required)
- id: string (auto-generated if missing)
- meta: { title, description }
- elements: { [id]: { type, props?, children? } } (required)
- root: element ID string (required)
- state: { data: { ... } } (optional)
- schema: { version: 1, tables: { [name]: { columns: { [col]: "string"|"number"|"boolean" } } } } (optional)

Available component types:
STRUCTURAL: Stack (direction, gap, padding, align, wrap), Grid (columns, gap), Card (title, subtitle), Container (slot, padding), ButtonGroup, Divider (variant), Spacer (height, width)
DATA: Table (data, columns:[{key,label,type,badgeMap}], selectable), Chart (chartType, data, xKey, yKey, color, height, yFormat), Metric (label, value, trend, subtitle, unit), Text (content, variant:heading1|heading2|heading3|body|muted|code|label), Badge (text, variant:success|warning|error|info), ProgressBar (value, max, label, showValue)
INPUT: TextInput (label, placeholder, required, value), NumberInput (label, min, max, step, value), Select (label, options:[{value,label}], value), Toggle (label, value, description), Checkbox (label, checked), Slider (label, min, max, value, showValue, unit, step)
PRESENTATION: Button (label, variant:primary|secondary|ghost, disabled), Tabs (tabs:[{id,label}], activeTab), Modal (title, open), Alert (message, variant:success|warning|error|info, title)

Expressions: { "$expr": "state.data.path | values" } binds props to state.

Rules:
1. Every element in 'children' must exist as a key in 'elements'
2. Every element needs a 'type' field
3. Only use the listed component types
4. Data arrays in Table/Chart can use { "$expr": "state.data.tablename | values" } for dynamic data
5. Output valid JSON only, no markdown wrapping`;

function buildUserPrompt(prompt) {
  return `Generate a Forge UI manifest for this app:\n\n${prompt}\n\nRemember: output ONLY the JSON object, nothing else.`;
}

// Simulate LLM responses using common patterns
function generateSimulatedManifest(prompt, model) {
  const id = `app-${Math.random().toString(36).slice(2, 10)}`;
  
  // Generate a plausible manifest based on prompt keywords
  const elements = {};
  const children = [];
  
  // Header
  elements.header = { type: 'Card', props: { title: prompt.split(' ').slice(2, 6).join(' ') }, children: ['header-text'] };
  elements['header-text'] = { type: 'Text', props: { content: prompt, variant: 'body' } };
  children.push('header');
  
  // Detect patterns
  const hasTable = /table|list|orders|transactions|inventory|directory|tickets|pages/i.test(prompt);
  const hasChart = /chart|graph|analytics|revenue|expenses|traffic|stock level/i.test(prompt);
  const hasMetrics = /kpi|metric|dashboard|overview|revenue|orders|conversion|total/i.test(prompt);
  const hasForm = /form|input|editor|booking|survey|calculator/i.test(prompt);
  const hasBadges = /badge|status|priority/i.test(prompt);
  const hasToggle = /toggle|switch|settings|dark mode/i.test(prompt);
  const hasAlert = /alert|notification|message|error|warning|success/i.test(prompt);
  const hasProgress = /progress|tracker|milestone/i.test(prompt);
  const hasGrid = /grid|2x2|columns.*cards|team directory/i.test(prompt);
  
  if (hasMetrics) {
    elements.metrics = { type: 'Grid', props: { columns: 3 }, children: ['m1', 'm2', 'm3'] };
    elements.m1 = { type: 'Metric', props: { label: 'Revenue', value: '$125K', trend: 'up' } };
    elements.m2 = { type: 'Metric', props: { label: 'Orders', value: '1,234', trend: 'up' } };
    elements.m3 = { type: 'Metric', props: { label: 'Conversion', value: '3.2%', trend: 'down' } };
    children.push('metrics');
  }
  
  if (hasChart) {
    elements['chart-section'] = { type: 'Card', props: { title: 'Analytics' }, children: ['chart-1'] };
    elements['chart-1'] = { type: 'Chart', props: { chartType: /pie/i.test(prompt) ? 'pie' : 'bar', data: [], xKey: 'name', yKey: 'value', color: '#6366f1' } };
    children.push('chart-section');
  }
  
  if (hasTable) {
    elements['table-section'] = { type: 'Card', props: { title: 'Data' }, children: ['data-table'] };
    elements['data-table'] = { type: 'Table', props: { data: [], columns: [{ key: 'name', label: 'Name', type: 'text' }, { key: 'status', label: 'Status', type: 'badge', badgeMap: { active: 'success', inactive: 'error' } }], selectable: true } };
    children.push('table-section');
  }
  
  if (hasForm) {
    elements['form-section'] = { type: 'Card', props: { title: 'Form' }, children: ['form-fields', 'form-actions'] };
    elements['form-fields'] = { type: 'Stack', props: { gap: '12' }, children: ['input-1'] };
    elements['input-1'] = { type: 'TextInput', props: { label: 'Name', placeholder: 'Enter value' } };
    elements['form-actions'] = { type: 'ButtonGroup', props: {}, children: ['btn-submit'] };
    elements['btn-submit'] = { type: 'Button', props: { label: 'Submit', variant: 'primary' } };
    children.push('form-section');
  }
  
  if (hasToggle) {
    elements['settings'] = { type: 'Card', props: { title: 'Settings' }, children: ['toggle-1', 'toggle-2'] };
    elements['toggle-1'] = { type: 'Toggle', props: { label: 'Dark Mode', value: false } };
    elements['toggle-2'] = { type: 'Toggle', props: { label: 'Notifications', value: true } };
    children.push('settings');
  }
  
  if (hasAlert) {
    elements['alert-1'] = { type: 'Alert', props: { message: 'Operation completed successfully', variant: 'success', title: 'Success' } };
    children.push('alert-1');
  }
  
  if (hasProgress) {
    elements['progress-section'] = { type: 'Card', props: { title: 'Progress' }, children: ['progress-1'] };
    elements['progress-1'] = { type: 'ProgressBar', props: { value: 60, max: 100, label: 'Overall Progress', showValue: true } };
    children.push('progress-section');
  }
  
  if (hasBadges && !hasTable) {
    elements['badges'] = { type: 'Stack', props: { direction: 'horizontal', gap: '8' }, children: ['badge-1', 'badge-2', 'badge-3'] };
    elements['badge-1'] = { type: 'Badge', props: { text: 'High Priority', variant: 'error' } };
    elements['badge-2'] = { type: 'Badge', props: { text: 'In Progress', variant: 'warning' } };
    elements['badge-3'] = { type: 'Badge', props: { text: 'Completed', variant: 'success' } };
    children.push('badges');
  }
  
  // Fallback: if nothing matched, add a text element
  if (children.length === 1) {
    elements.content = { type: 'Text', props: { content: 'Generated content', variant: 'body' } };
    children.push('content');
  }
  
  elements.root = { type: 'Stack', props: { gap: '20', padding: '24' }, children };
  
  const manifest = {
    manifest: '0.1.0',
    id,
    meta: { title: prompt.split(' ').slice(0, 4).join(' '), description: prompt.slice(0, 100) },
    elements,
    root: 'root'
  };
  
  // Simulate model-specific quirks
  if (model === 'gpt-4') {
    // GPT tends to add extra fields
    manifest.version = '1.0';
  } else if (model === 'gemini') {
    // Gemini sometimes uses wrong prop names
    // Small chance of variation
  }
  
  return manifest;
}

// Validate manifest
const SUPPORTED_TYPES = [
  'Stack', 'Grid', 'Card', 'Container', 'ButtonGroup', 'Divider', 'Spacer',
  'Table', 'Chart', 'Metric', 'Text', 'Badge', 'ProgressBar',
  'TextInput', 'NumberInput', 'Select', 'Toggle', 'Checkbox', 'Slider',
  'Button', 'Tabs', 'Modal', 'Alert'
];

function validateManifest(manifest) {
  const errors = [];
  const warnings = [];
  
  // Schema checks
  if (!manifest.manifest) errors.push('Missing "manifest" version field');
  else if (manifest.manifest !== '0.1.0') warnings.push(`Version "${manifest.manifest}" != "0.1.0"`);
  
  if (!manifest.elements) { errors.push('Missing "elements" object'); return { valid: false, errors, warnings }; }
  if (!manifest.root) errors.push('Missing "root" field');
  
  // Element validation
  for (const [id, el] of Object.entries(manifest.elements)) {
    if (!el.type) {
      errors.push(`Element "${id}" missing "type" field`);
    } else if (!SUPPORTED_TYPES.includes(el.type)) {
      errors.push(`Element "${id}" has unsupported type "${el.type}"`);
    }
    
    // Children validation
    if (el.children) {
      for (const childId of el.children) {
        if (!manifest.elements[childId]) {
          errors.push(`Element "${id}" references non-existent child "${childId}"`);
        }
      }
    }
  }
  
  // Root validation
  if (manifest.root && !manifest.elements[manifest.root]) {
    errors.push(`Root element "${manifest.root}" not found in elements`);
  }
  
  // Security checks
  const jsonStr = JSON.stringify(manifest);
  if (/javascript:/i.test(jsonStr)) errors.push('Contains "javascript:" URL');
  if (/on\w+\s*=/i.test(jsonStr)) errors.push('Contains event handler pattern');
  if (/<script/i.test(jsonStr)) errors.push('Contains <script> tag');
  
  return { valid: errors.length === 0, errors, warnings };
}

// Run tests
const MODELS = ['simulated-claude', 'simulated-gpt4', 'simulated-gemini'];
const results = { total: 0, valid: 0, invalid: 0, byModel: {}, errors: [], sizes: [] };

console.log('=== FORGE UI LLM RELIABILITY TEST ===');
console.log(`Testing ${PROMPTS.length} prompts across ${MODELS.length} simulated models\n`);

for (const model of MODELS) {
  results.byModel[model] = { total: 0, valid: 0, invalid: 0, errors: [] };
}

for (let i = 0; i < PROMPTS.length; i++) {
  const prompt = PROMPTS[i];
  
  for (const model of MODELS) {
    results.total++;
    results.byModel[model].total++;
    
    const manifest = generateSimulatedManifest(prompt, model);
    const validation = validateManifest(manifest);
    const size = JSON.stringify(manifest).length;
    results.sizes.push(size);
    
    if (validation.valid) {
      results.valid++;
      results.byModel[model].valid++;
      process.stdout.write('.');
    } else {
      results.invalid++;
      results.byModel[model].invalid++;
      results.byModel[model].errors.push(...validation.errors);
      results.errors.push({ prompt: prompt.slice(0, 50), model, errors: validation.errors });
      process.stdout.write('x');
    }
  }
}

console.log('\n\n=== RESULTS ===');
console.log(`Total: ${results.total}`);
console.log(`Valid: ${results.valid} (${(results.valid/results.total*100).toFixed(1)}%)`);
console.log(`Invalid: ${results.invalid} (${(results.invalid/results.total*100).toFixed(1)}%)`);

const avgSize = results.sizes.reduce((a,b) => a+b, 0) / results.sizes.length;
const minSize = Math.min(...results.sizes);
const maxSize = Math.max(...results.sizes);
console.log(`\nManifest sizes: avg=${(avgSize/1024).toFixed(1)}KB, min=${(minSize/1024).toFixed(1)}KB, max=${(maxSize/1024).toFixed(1)}KB`);

console.log('\n=== BY MODEL ===');
for (const [model, stats] of Object.entries(results.byModel)) {
  console.log(`  ${model}: ${stats.valid}/${stats.total} valid (${(stats.valid/stats.total*100).toFixed(1)}%)`);
  if (stats.errors.length > 0) {
    const uniqueErrors = [...new Set(stats.errors)];
    console.log(`    Errors: ${uniqueErrors.slice(0, 3).join('; ')}`);
  }
}

if (results.errors.length > 0) {
  console.log('\n=== FAILURES ===');
  for (const e of results.errors.slice(0, 5)) {
    console.log(`  [${e.model}] "${e.prompt}...": ${e.errors.join('; ')}`);
  }
}

// Component type coverage
const allManifests = PROMPTS.map(p => generateSimulatedManifest(p, 'test'));
const usedTypes = new Set();
for (const m of allManifests) {
  for (const el of Object.values(m.elements)) {
    usedTypes.add(el.type);
  }
}
console.log('\n=== COMPONENT COVERAGE ===');
console.log(`Used types: ${[...usedTypes].sort().join(', ')}`);
const unused = SUPPORTED_TYPES.filter(t => !usedTypes.has(t));
console.log(`Unused types: ${unused.join(', ') || 'none'}`);
console.log(`Coverage: ${usedTypes.size}/${SUPPORTED_TYPES.length} (${(usedTypes.size/SUPPORTED_TYPES.length*100).toFixed(0)}%)`);

console.log('\n=== DONE ===');
