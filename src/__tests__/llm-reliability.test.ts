/**
 * LLM Reliability Test Harness
 * 
 * Simulates the kinds of manifests different LLMs produce and validates
 * them against the Forge validation pipeline. Measures how robust the
 * system is against real-world LLM output variations.
 * 
 * Run: npx tsx src/__tests__/llm-reliability.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { validateManifest } from '../validation/index.js';

// ─── Helpers ───────────────────────────────────────────────

function valid(override: Record<string, any> = {}) {
  return {
    manifest: '0.1.0',
    id: 'test-app',
    meta: { title: 'Test' },
    elements: {
      root: { type: 'Card', props: { title: 'Hello' } }
    },
    root: 'root',
    ...override,
  };
}

function checkValid(m: any, label: string) {
  const r = validateManifest(m);
  if (!r.valid) {
    console.error(`  ❌ ${label}: ${r.errors.map(e => `${e.path}: ${e.message}`).join(', ')}`);
  }
  return r;
}

// ─── Test Groups ───────────────────────────────────────────

describe('LLM Reliability — Manifest Structure', () => {

  it('valid minimal manifest passes', () => {
    const r = checkValid(valid(), 'minimal');
    assert.ok(r.valid);
  });

  it('rejects missing manifest version', () => {
    const m = valid();
    delete (m as any).manifest;
    const r = checkValid(m, 'no version');
    assert.ok(!r.valid);
  });

  it('rejects missing id', () => {
    const m = valid();
    delete (m as any).id;
    const r = checkValid(m, 'no id');
    assert.ok(!r.valid);
  });

  it('rejects missing root', () => {
    const m = valid();
    delete (m as any).root;
    const r = checkValid(m, 'no root');
    assert.ok(!r.valid);
  });

  it('rejects empty elements', () => {
    const m = valid({ elements: {} });
    const r = checkValid(m, 'empty elements');
    assert.ok(!r.valid);
  });

  it('rejects invalid component type', () => {
    const m = valid({
      elements: { root: { type: 'InvalidType', props: {} } }
    });
    const r = checkValid(m, 'invalid type');
    assert.ok(!r.valid);
  });

  it('accepts all valid component types', () => {
    const types = [
      'Stack', 'Grid', 'Card', 'Container', 'Tabs', 'Accordion', 'Divider', 'Spacer',
      'Text', 'Image', 'Icon', 'Badge', 'Avatar', 'EmptyState',
      'TextInput', 'NumberInput', 'Select', 'MultiSelect', 'Checkbox', 'Toggle',
      'DatePicker', 'Slider', 'FileUpload',
      'Button', 'ButtonGroup', 'Link',
      'Table', 'List', 'Chart', 'Metric',
      'Alert', 'Dialog', 'Progress', 'Toast',
      'Breadcrumb', 'Stepper', 'Drawing',
    ];
    for (const type of types) {
      const m = valid({
        elements: { root: { type, props: {} } }
      });
      const r = checkValid(m, `type:${type}`);
      assert.ok(r.valid, `${type} should be valid`);
    }
  });
});

describe('LLM Reliability — Common LLM Mistakes', () => {

  it('handles extra unknown fields (should be valid)', () => {
    const m = valid({
      description: 'I am extra',
      author: 'GPT-4',
      custom_field: { nested: true },
    });
    const r = checkValid(m, 'extra fields');
    assert.ok(r.valid, 'Extra fields should not cause rejection');
  });

  it('handles missing meta (optional)', () => {
    const m = valid();
    delete (m as any).meta;
    const r = checkValid(m, 'no meta');
    assert.ok(r.valid);
  });

  it('handles missing state (optional)', () => {
    const m = valid();
    delete (m as any).state;
    const r = checkValid(m, 'no state');
    assert.ok(r.valid);
  });

  it('handles empty props object', () => {
    const m = valid({
      elements: { root: { type: 'Stack', props: {} } }
    });
    const r = checkValid(m, 'empty props');
    assert.ok(r.valid);
  });

  it('handles element with no props', () => {
    const m = valid({
      elements: { root: { type: 'Stack' } }
    });
    const r = checkValid(m, 'no props');
    assert.ok(r.valid);
  });

  it('handles element with children array', () => {
    const m = valid({
      elements: {
        root: { type: 'Stack', props: {}, children: ['child1'] },
        child1: { type: 'Text', props: { content: 'Hello' } },
      }
    });
    const r = checkValid(m, 'with children');
    assert.ok(r.valid);
  });

  it('handles nested layout with many children', () => {
    const m = valid({
      elements: {
        root: { type: 'Grid', props: { columns: 3 }, children: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'] },
        c1: { type: 'Card', props: { title: 'Card 1' } },
        c2: { type: 'Card', props: { title: 'Card 2' } },
        c3: { type: 'Card', props: { title: 'Card 3' } },
        c4: { type: 'Metric', props: { label: 'M1', value: '100' } },
        c5: { type: 'Metric', props: { label: 'M2', value: '200' } },
        c6: { type: 'Metric', props: { label: 'M3', value: '300' } },
      }
    });
    const r = checkValid(m, 'nested grid');
    assert.ok(r.valid);
  });

  it('handles deep nesting (3 levels)', () => {
    const m = valid({
      elements: {
        root: { type: 'Stack', props: {}, children: ['level1'] },
        level1: { type: 'Card', props: {}, children: ['level2'] },
        level2: { type: 'Grid', props: { columns: 2 }, children: ['leaf1', 'leaf2'] },
        leaf1: { type: 'Text', props: { content: 'Deep 1' } },
        leaf2: { type: 'Badge', props: { text: 'Deep 2' } },
      }
    });
    const r = checkValid(m, 'deep nesting');
    assert.ok(r.valid);
  });

  it('handles element with visible condition', () => {
    const m = valid({
      state: { data: { show: true } },
      elements: {
        root: { type: 'Stack', props: {}, children: ['conditional'] },
        conditional: {
          type: 'Text',
          props: { content: 'Shown conditionally' },
          visible: { $expr: 'state.data.show' },
        },
      }
    });
    const r = checkValid(m, 'conditional visible');
    assert.ok(r.valid);
  });

  it('handles action definitions', () => {
    const m = valid({
      actions: {
        addItem: {
          handler: 'state.items.push(action.payload)',
        },
        removeItem: {
          handler: 'state.items.splice(action.payload.index, 1)',
        },
      },
      state: { data: { items: [] } },
      elements: {
        root: { type: 'Stack', props: {}, children: ['btn'] },
        btn: { type: 'Button', props: { label: 'Add' } },
      }
    });
    const r = checkValid(m, 'with actions');
    assert.ok(r.valid);
  });

  it('handles schema definitions', () => {
    const m = valid({
      schema: {
        version: 1,
        tables: {
          users: {
            columns: {
              id: 'string',
              name: 'string',
              email: 'string',
              age: 'number',
              active: 'boolean',
            }
          }
        }
      },
    });
    const r = checkValid(m, 'with schema');
    assert.ok(r.valid);
  });
});

describe('LLM Reliability — Security Scenarios', () => {

  it('rejects javascript: URLs', () => {
    const m = valid({
      elements: { root: { type: 'Button', props: { href: 'javascript:alert(1)' } } }
    });
    const r = checkValid(m, 'javascript url');
    assert.ok(!r.valid, 'Should reject javascript: URLs');
  });

  it('rejects data: URLs', () => {
    const m = valid({
      elements: { root: { type: 'Button', props: { href: 'data:text/html,<script>alert(1)</script>' } } }
    });
    const r = checkValid(m, 'data url');
    assert.ok(!r.valid, 'Should reject data: URLs');
  });

  it('handles oversized manifests (warns about size)', () => {
    const bigData = 'x'.repeat(200_000);
    const m = valid({
      state: { data: { blob: bigData } }
    });
    const r = checkValid(m, 'oversized');
    // Should still return a result (not crash)
    assert.ok(r.valid !== undefined);
    const hasSizeWarning = r.warnings.some(w => w.message.toLowerCase().includes('size'));
    assert.ok(hasSizeWarning, 'Should warn about oversized manifest');
  });

  it('handles expressions in state references', () => {
    const m = valid({
      state: { data: { count: 0, name: 'test' } },
      elements: {
        root: { type: 'Stack', props: {}, children: ['metric'] },
        metric: {
          type: 'Metric',
          props: {
            label: { $expr: 'state.data.name' },
            value: { $expr: 'state.data.count' },
          }
        },
      }
    });
    const r = checkValid(m, 'expression refs');
    assert.ok(r.valid);
  });
});

describe('LLM Reliability — Complex Real-World Manifests', () => {

  it('full CRUD table app', () => {
    const m = {
      manifest: '0.1.0',
      id: 'todo-app',
      meta: { title: 'Todo App' },
      schema: {
        version: 1,
        tables: {
          todos: {
            columns: {
              id: 'string',
              text: 'string',
              done: 'boolean',
              priority: 'string',
              createdAt: 'string',
            }
          }
        }
      },
      state: {
        data: {
          todos: {
            't1': { id: 't1', text: 'Buy groceries', done: false, priority: 'high', createdAt: '2025-04-14' },
            't2': { id: 't2', text: 'Write tests', done: true, priority: 'medium', createdAt: '2025-04-14' },
            't3': { id: 't3', text: 'Deploy to production', done: false, priority: 'high', createdAt: '2025-04-14' },
          }
        }
      },
      elements: {
        root: { type: 'Stack', props: { gap: '16', padding: '24' }, children: ['header', 'form', 'list'] },
        header: { type: 'Card', props: { title: 'Todo App' }, children: ['badges'] },
        badges: {
          type: 'Stack',
          props: { direction: 'horizontal', gap: '8' },
          children: ['b1', 'b2', 'b3']
        },
        b1: { type: 'Badge', props: { text: 'CRUD Demo', variant: 'info' } },
        b2: { type: 'Badge', props: { text: '3 items', variant: 'success' } },
        b3: { type: 'Badge', props: { text: '2 pending', variant: 'warning' } },
        form: { type: 'Card', props: { title: 'Add Todo' }, children: ['form-fields'] },
        'form-fields': {
          type: 'Stack',
          props: { gap: '8' },
          children: ['input-text', 'select-priority', 'btn-add']
        },
        'input-text': { type: 'TextInput', props: { label: 'Todo', placeholder: 'What needs to be done?', required: true } },
        'select-priority': {
          type: 'Select',
          props: {
            label: 'Priority',
            options: [
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]
          }
        },
        'btn-add': { type: 'Button', props: { label: 'Add Todo', variant: 'primary', disabled: true } },
        list: { type: 'Card', props: { title: 'Your Todos' }, children: ['table'] },
        table: {
          type: 'Table',
          props: {
            data: { '$expr': 'state.data.todos | values' },
            columns: [
              { key: 'done', label: 'Done', type: 'checkbox' },
              { key: 'text', label: 'Todo', type: 'text' },
              { key: 'priority', label: 'Priority', type: 'badge', badgeMap: { high: 'error', medium: 'warning', low: 'success' } },
              { key: 'createdAt', label: 'Created', type: 'text' },
            ],
            selectable: true,
          }
        },
      },
      root: 'root',
    };
    const r = checkValid(m, 'todo app');
    assert.ok(r.valid);
  });

  it('multi-tab settings with tabs, toggles, selects', () => {
    const m = {
      manifest: '0.1.0',
      id: 'admin-settings',
      meta: { title: 'Admin Settings' },
      elements: {
        root: { type: 'Stack', props: { gap: '16', padding: '24' }, children: ['tabs'] },
        tabs: {
          type: 'Tabs',
          props: {
            tabs: [
              { label: 'General', id: 'general' },
              { label: 'Security', id: 'security' },
              { label: 'API', id: 'api' },
            ],
            activeTab: 'general',
          },
          children: ['tab-general', 'tab-security', 'tab-api']
        },
        'tab-general': {
          type: 'Container',
          props: { slot: 'general', padding: '16' },
          children: ['theme', 'lang', 'tz']
        },
        theme: { type: 'Toggle', props: { label: 'Dark Mode', value: true } },
        lang: {
          type: 'Select',
          props: {
            label: 'Language',
            options: [
              { value: 'en', label: 'English' },
              { value: 'de', label: 'Deutsch' },
              { value: 'fr', label: 'Français' },
            ],
            value: 'en'
          }
        },
        tz: {
          type: 'Select',
          props: {
            label: 'Timezone',
            options: [
              { value: 'Europe/Zurich', label: 'Europe/Zurich' },
              { value: 'America/New_York', label: 'America/New_York' },
            ],
            value: 'Europe/Zurich'
          }
        },
        'tab-security': {
          type: 'Container',
          props: { slot: 'security', padding: '16' },
          children: ['alert-sec', 'toggle-2fa']
        },
        'alert-sec': {
          type: 'Alert',
          props: { message: 'Enable 2FA for better security', variant: 'warning', title: 'Security' }
        },
        'toggle-2fa': { type: 'Toggle', props: { label: 'Two-Factor Auth', value: false } },
        'tab-api': {
          type: 'Container',
          props: { slot: 'api', padding: '16' },
          children: ['api-table', 'btn-gen']
        },
        'api-table': {
          type: 'Table',
          props: {
            data: [
              { key: 'sk-live-abc...', name: 'Production', created: '2025-01-15', status: 'active' },
              { key: 'sk-test-xyz...', name: 'Test', created: '2025-02-20', status: 'active' },
            ],
            columns: [
              { key: 'name', label: 'Key Name', type: 'text' },
              { key: 'key', label: 'Key', type: 'text' },
              { key: 'created', label: 'Created', type: 'text' },
              { key: 'status', label: 'Status', type: 'badge', badgeMap: { active: 'success', revoked: 'error' } },
            ]
          }
        },
        'btn-gen': { type: 'Button', props: { label: 'Generate New Key', variant: 'primary' } },
      },
      root: 'root',
    };
    const r = checkValid(m, 'admin settings');
    assert.ok(r.valid);
  });
});

describe('LLM Reliability — Demo Apps (from examples/)', () => {

  const demos = [
    ['01-nutrition-tracker.json', 'Nutrition Tracker'],
    ['02-analytics-dashboard.json', 'Analytics Dashboard'],
    ['03-feedback-form.json', 'Feedback Form'],
    ['04-onboarding-wizard.json', 'Onboarding Wizard'],
    ['05-settings-panel.json', 'Settings Panel'],
  ];

  for (const [file, name] of demos) {
    it(`${name} validates`, () => {
      const m = JSON.parse(readFileSync(`/tmp/forgeui/examples/${file}`, 'utf8'));
      const r = checkValid(m, name);
      assert.ok(r.valid, `${name} should be valid`);
    });
  }
});
