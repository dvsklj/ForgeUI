// A2UI Compatibility Test for Forge UI
import { readFileSync } from 'fs';
import { join } from 'path';

const forgeDir = '/tmp/forgeui';

// Component catalog — what Forge supports
const SUPPORTED_TYPES = [
  'Stack', 'Grid', 'Card', 'Container', 'ButtonGroup', 'Divider', 'Spacer',
  'Table', 'Chart', 'Metric', 'Text', 'Badge', 'ProgressBar',
  'TextInput', 'NumberInput', 'Select', 'Toggle', 'Checkbox', 'Slider',
  'Button', 'Tabs', 'Modal', 'Alert'
];

// A2UI → Forge mapping
const A2UI_TO_FORGE = {
  'a2ui/Text': 'Text',
  'a2ui/Heading': 'Text',        // variant: heading1
  'a2ui/Button': 'Button',
  'a2ui/Card': 'Card',
  'a2ui/Stack': 'Stack',
  'a2ui/Grid': 'Grid',
  'a2ui/TextInput': 'TextInput',
  'a2ui/Select': 'Select',
  'a2ui/Checkbox': 'Checkbox',
  'a2ui/Toggle': 'Toggle',
  'a2ui/Table': 'Table',
  'a2ui/Chart': 'Chart',
  'a2ui/Alert': 'Alert',
  'a2ui/Badge': 'Badge',
  'a2ui/ProgressBar': 'ProgressBar',
  'a2ui/Tabs': 'Tabs',
  'a2ui/Modal': 'Modal',
  'a2ui/Slider': 'Slider',
  'a2ui/Divider': 'Divider',
  'a2ui/Spacer': 'Spacer',
};

// Prop mapping rules (A2UI prop → Forge prop)
const PROP_MAPS = {
  'Text': { 'content': 'content', 'variant': 'variant', 'text': 'content' },
  'Button': { 'label': 'label', 'variant': 'variant', 'text': 'label', 'onClick': null },
  'Card': { 'title': 'title', 'subtitle': 'subtitle' },
  'Stack': { 'direction': 'direction', 'gap': 'gap', 'padding': 'padding' },
  'Grid': { 'columns': 'columns', 'gap': 'gap' },
  'TextInput': { 'label': 'label', 'placeholder': 'placeholder', 'value': 'value' },
  'Select': { 'label': 'label', 'options': 'options', 'value': 'value' },
  'Table': { 'data': 'data', 'columns': 'columns' },
  'Alert': { 'message': 'message', 'variant': 'variant', 'title': 'title' },
  'Badge': { 'text': 'text', 'variant': 'variant' },
  'ProgressBar': { 'value': 'value', 'max': 'max', 'label': 'label' },
};

// 20 test payloads — each is an A2UI component definition
const testPayloads = [
  {
    name: 'Simple Text',
    a2ui: { type: 'a2ui/Text', props: { content: 'Hello World', variant: 'body' } },
    expectedType: 'Text'
  },
  {
    name: 'Heading',
    a2ui: { type: 'a2ui/Heading', props: { text: 'Dashboard', variant: 'heading1' } },
    expectedType: 'Text'
  },
  {
    name: 'Primary Button',
    a2ui: { type: 'a2ui/Button', props: { label: 'Save', variant: 'primary' } },
    expectedType: 'Button'
  },
  {
    name: 'Card with children',
    a2ui: { type: 'a2ui/Card', props: { title: 'Stats', subtitle: 'Overview' } },
    expectedType: 'Card'
  },
  {
    name: 'Vertical Stack',
    a2ui: { type: 'a2ui/Stack', props: { direction: 'vertical', gap: '16' } },
    expectedType: 'Stack'
  },
  {
    name: 'Grid 3-col',
    a2ui: { type: 'a2ui/Grid', props: { columns: 3, gap: '12' } },
    expectedType: 'Grid'
  },
  {
    name: 'Text Input',
    a2ui: { type: 'a2ui/TextInput', props: { label: 'Name', placeholder: 'Enter name' } },
    expectedType: 'TextInput'
  },
  {
    name: 'Select Dropdown',
    a2ui: { type: 'a2ui/Select', props: { label: 'Category', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] } },
    expectedType: 'Select'
  },
  {
    name: 'Checkbox',
    a2ui: { type: 'a2ui/Checkbox', props: { label: 'Accept', checked: false } },
    expectedType: 'Checkbox'
  },
  {
    name: 'Toggle',
    a2ui: { type: 'a2ui/Toggle', props: { label: 'Dark Mode', value: true } },
    expectedType: 'Toggle'
  },
  {
    name: 'Data Table',
    a2ui: { type: 'a2ui/Table', props: { data: [], columns: [{ key: 'name', label: 'Name' }] } },
    expectedType: 'Table'
  },
  {
    name: 'Bar Chart',
    a2ui: { type: 'a2ui/Chart', props: { chartType: 'bar', data: [], xKey: 'month', yKey: 'value' } },
    expectedType: 'Chart'
  },
  {
    name: 'Alert Warning',
    a2ui: { type: 'a2ui/Alert', props: { message: 'Low stock', variant: 'warning', title: 'Warning' } },
    expectedType: 'Alert'
  },
  {
    name: 'Badge Status',
    a2ui: { type: 'a2ui/Badge', props: { text: 'Active', variant: 'success' } },
    expectedType: 'Badge'
  },
  {
    name: 'Progress Bar',
    a2ui: { type: 'a2ui/ProgressBar', props: { value: 75, max: 100, label: 'Upload' } },
    expectedType: 'ProgressBar'
  },
  {
    name: 'Tabs',
    a2ui: { type: 'a2ui/Tabs', props: { tabs: [{ id: 'a', label: 'Tab A' }, { id: 'b', label: 'Tab B' }], activeTab: 'a' } },
    expectedType: 'Tabs'
  },
  {
    name: 'Modal',
    a2ui: { type: 'a2ui/Modal', props: { title: 'Confirm', open: false } },
    expectedType: 'Modal'
  },
  {
    name: 'Slider',
    a2ui: { type: 'a2ui/Slider', props: { label: 'Volume', min: 0, max: 100, value: 50 } },
    expectedType: 'Slider'
  },
  {
    name: 'Divider',
    a2ui: { type: 'a2ui/Divider', props: { variant: 'solid' } },
    expectedType: 'Divider'
  },
  {
    name: 'Spacer',
    a2ui: { type: 'a2ui/Spacer', props: { height: '24' } },
    expectedType: 'Spacer'
  },
];

// Convert A2UI → Forge
function convertA2UI(a2ui) {
  const forgeType = A2UI_TO_FORGE[a2ui.type];
  if (!forgeType) return { success: false, error: `Unknown A2UI type: ${a2ui.type}` };

  const props = { ...a2ui.props };

  // Special handling for Heading → Text
  if (a2ui.type === 'a2ui/Heading') {
    props.content = props.text || props.content;
    props.variant = props.variant || 'heading1';
    delete props.text;
  }

  // Map known props
  const propMap = PROP_MAPS[forgeType] || {};
  const mappedProps = {};
  for (const [key, value] of Object.entries(props)) {
    const mappedKey = propMap[key] !== undefined ? propMap[key] : key;
    if (mappedKey === null) continue; // skip (e.g. onClick)
    mappedProps[mappedKey] = value;
  }

  return {
    success: true,
    forge: {
      type: forgeType,
      props: mappedProps,
      children: a2ui.children || []
    }
  };
}

// Create a full Forge manifest from a converted element
function toManifest(forgeElement, id = 'test') {
  return {
    manifest: '0.1.0',
    id: `compat-${id}`,
    meta: { title: `A2UI Compat: ${id}` },
    elements: {
      root: {
        type: 'Stack',
        props: { gap: '16', padding: '24' },
        children: [id]
      },
      [id]: forgeElement
    },
    root: 'root'
  };
}

// Validate structure (simplified — full Ajv not available in this context)
function validateStructure(manifest) {
  const errors = [];
  if (!manifest.manifest) errors.push('Missing "manifest" version field');
  if (!manifest.elements) errors.push('Missing "elements"');
  if (!manifest.root) errors.push('Missing "root"');
  if (manifest.elements) {
    for (const [id, el] of Object.entries(manifest.elements)) {
      if (!el.type) errors.push(`Element "${id}" missing "type"`);
      else if (!SUPPORTED_TYPES.includes(el.type)) errors.push(`Element "${id}" has unsupported type "${el.type}"`);
    }
  }
  return { valid: errors.length === 0, errors };
}

// Run tests
console.log('=== A2UI COMPATIBILITY TEST ===\n');

let pass = 0;
let fail = 0;
let adapt = 0;
const results = [];

for (const test of testPayloads) {
  const converted = convertA2UI(test.a2ui);
  
  if (!converted.success) {
    fail++;
    results.push({ name: test.name, status: 'FAIL', error: converted.error });
    continue;
  }
  
  const manifest = toManifest(converted.forge, test.name.replace(/\s+/g, '-').toLowerCase());
  const validation = validateStructure(manifest);
  
  if (validation.valid) {
    pass++;
    results.push({ name: test.name, status: 'PASS', forgeType: converted.forge.type, props: Object.keys(converted.forge.props).length });
  } else {
    fail++;
    results.push({ name: test.name, status: 'FAIL', errors: validation.errors });
  }
}

console.log(`Results: ${pass}/${testPayloads.length} PASS, ${fail} FAIL\n`);

for (const r of results) {
  const icon = r.status === 'PASS' ? '✅' : '❌';
  const detail = r.status === 'PASS' 
    ? `${r.forgeType} (${r.props} props)` 
    : r.errors ? r.errors.join('; ') : r.error;
  console.log(`  ${icon} ${r.name}: ${detail}`);
}

// Coverage analysis
console.log('\n=== COVERAGE ===');
const mappedTypes = new Set(Object.values(A2UI_TO_FORGE));
const unmapped = SUPPORTED_TYPES.filter(t => !mappedTypes.has(t));
const unmappedA2ui = ['a2ui/Image', 'a2ui/Link', 'a2ui/Form', 'a2ui/Code'];

console.log(`  Forge types covered by A2UI mapping: ${mappedTypes.size}/${SUPPORTED_TYPES.length}`);
console.log(`  Forge types NOT in A2UI: ${unmapped.join(', ') || 'none'}`);
console.log(`  A2UI types NOT in Forge: ${unmappedA2ui.join(', ')}`);
console.log(`  Prop mapping fidelity: ${Object.keys(PROP_MAPS).length}/${Object.keys(A2UI_TO_FORGE).length} types have explicit prop maps`);

console.log('\n=== DONE ===');
