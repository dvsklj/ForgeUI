import { describe, it, expect } from 'vitest';
import { isValidComponentType, ALL_COMPONENT_TYPES, componentCategories, componentsByCategory } from '../src/catalog/registry.js';
import { catalogPrompt, catalogToJsonSchema } from '../src/catalog/prompt.js';

describe('isValidComponentType', () => {
  it('accepts all valid component types', () => {
    const expectedTypes = [
      'Stack', 'Grid', 'Card', 'Container', 'Tabs', 'Accordion', 'Divider', 'Spacer', 'Repeater',
      'Text', 'Image', 'Icon', 'Badge', 'Avatar', 'EmptyState',
      'TextInput', 'NumberInput', 'Select', 'MultiSelect', 'Checkbox', 'Toggle', 'DatePicker', 'Slider', 'FileUpload',
      'Button', 'ButtonGroup', 'Link',
      'Table', 'List', 'Chart', 'Metric',
      'Alert', 'Dialog', 'Progress', 'Toast',
      'Breadcrumb', 'Stepper',
      'Drawing',
    ];
    for (const type of expectedTypes) {
      expect(isValidComponentType(type), `${type} should be valid`).toBe(true);
    }
  });

  it('rejects invalid component types', () => {
    expect(isValidComponentType('Invalid')).toBe(false);
    expect(isValidComponentType('')).toBe(false);
    expect(isValidComponentType('stack')).toBe(false);
    expect(isValidComponentType('BUTTON')).toBe(false);
    expect(isValidComponentType('Div')).toBe(false);
  });

  it('validates type guard behavior', () => {
    const type = 'Text';
    if (isValidComponentType(type)) {
      expect(typeof type).toBe('string');
    }
  });
});

describe('ALL_COMPONENT_TYPES', () => {
  it('contains all expected component types', () => {
    expect(ALL_COMPONENT_TYPES.length).toBeGreaterThanOrEqual(37);
  });

  it('all types are unique', () => {
    expect(new Set(ALL_COMPONENT_TYPES).size).toBe(ALL_COMPONENT_TYPES.length);
  });
});

describe('componentCategories', () => {
  it('maps every component to a valid category', () => {
    for (const type of ALL_COMPONENT_TYPES) {
      expect(componentCategories[type], `${type} should have a category`).toBeDefined();
    }
  });

  it('categories are from the known set', () => {
    const valid = new Set(['layout', 'content', 'input', 'action', 'data', 'feedback', 'navigation', 'drawing']);
    for (const type of ALL_COMPONENT_TYPES) {
      expect(valid.has(componentCategories[type])).toBe(true);
    }
  });
});

describe('componentsByCategory', () => {
  it('every category has at least one component', () => {
    for (const [, types] of Object.entries(componentsByCategory)) {
      expect(types.length).toBeGreaterThan(0);
    }
  });

  it('total components across categories equals ALL_COMPONENT_TYPES length', () => {
    const total = Object.values(componentsByCategory).reduce((sum, types) => sum + types.length, 0);
    expect(total).toBe(ALL_COMPONENT_TYPES.length);
  });
});

describe('catalogPrompt', () => {
  it('returns a string for minimal tier', () => {
    const prompt = catalogPrompt('minimal');
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain('MANIFEST');
    expect(prompt).toContain('Stack');
  });

  it('returns a string for default tier', () => {
    const prompt = catalogPrompt('default');
    expect(prompt.length).toBeGreaterThan(catalogPrompt('minimal').length);
    expect(prompt).toContain('DETAILED COMPONENT REFERENCE');
  });

  it('returns a string for full tier', () => {
    const prompt = catalogPrompt('full');
    expect(prompt.length).toBeGreaterThan(catalogPrompt('default').length);
    expect(prompt).toContain('DATA ACCESS');
  });

  it('includes all component types in minimal prompt', () => {
    const prompt = catalogPrompt('minimal');
    for (const type of ALL_COMPONENT_TYPES) {
      expect(prompt).toContain(type);
    }
  });

  it('requires a visible theme toggle when dark and light modes are generated', () => {
    expect(catalogPrompt('minimal')).toContain('If the app offers dark and light modes');
    expect(catalogPrompt('default')).toContain('If dark/light modes exist, include a visible bound Toggle');
    expect(catalogPrompt('full')).toContain('must not include theme state without an on-screen toggle');
  });
});

describe('catalogToJsonSchema', () => {
  it('returns required fields', () => {
    const schema = catalogToJsonSchema();
    expect(schema.required).toContain('manifest');
    expect(schema.required).toContain('id');
    expect(schema.required).toContain('elements');
  });

  it('includes all component types in enum', () => {
    const schema = catalogToJsonSchema();
    const elementsType = (schema.properties as any).elements;
    const additionalProps = elementsType.additionalProperties;
    const typeEnum = additionalProps.properties.type.enum;
    expect(typeEnum).toContain('Text');
    expect(typeEnum).toContain('Button');
    expect(typeEnum).toContain('Drawing');
  });

  it('includes visibility condition schema', () => {
    const schema = catalogToJsonSchema();
    const elementsType = (schema.properties as any).elements;
    const visibleSchema = elementsType.additionalProperties.properties.visible;
    expect(visibleSchema).toBeDefined();
    expect(visibleSchema.type).toBe('object');
  });

  it('includes dataAccess schema', () => {
    const schema = catalogToJsonSchema();
    expect((schema.properties as any).dataAccess).toBeDefined();
  });

  it('includes actions schema', () => {
    const schema = catalogToJsonSchema();
    expect((schema.properties as any).actions).toBeDefined();
  });
});
