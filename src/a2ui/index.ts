/**
 * A2UI Ingest Adapter
 * 
 * Accepts pure A2UI (Agent-to-User Interface) payloads and converts
 * them to Forge manifests. A2UI is a subset — any valid A2UI payload
 * renders in Forge as-is via this adapter.
 * 
 * Reference: Google's A2UI protocol v0.8+
 * https://github.com/google/a2ui
 */

import type { ForgeManifest, ForgeElement, ComponentType } from '../types/index.js';
import { isValidComponentType } from '../catalog/registry.js';

/** A2UI component type → Forge component type mapping */
const A2UI_TO_FORGE: Record<string, ComponentType> = {
  // A2UI has its own component vocabulary. Map to Forge equivalents.
  container: 'Stack',
  row: 'Stack',
  column: 'Stack',
  text: 'Text',
  heading: 'Text',
  label: 'Text',
  image: 'Image',
  icon: 'Icon',
  button: 'Button',
  link: 'Link',
  textInput: 'TextInput',
  numberInput: 'NumberInput',
  checkbox: 'Checkbox',
  toggle: 'Toggle',
  select: 'Select',
  divider: 'Divider',
  spacer: 'Spacer',
  card: 'Card',
  table: 'Table',
  list: 'List',
  alert: 'Alert',
  progress: 'Progress',
  badge: 'Badge',
  avatar: 'Avatar',
};

/** A2UI input payload format */
interface A2UIPayload {
  /** A2UI version string (e.g., "a2ui/v0.8", "0.8") */
  version?: string;
  /** A2UI type identifier (e.g., "adaptive-card") */
  type?: string;
  /** Component list — A2UI may use either "content" or "components" array */
  components?: A2UIComponent[];
  content?: A2UIComponent[];
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

interface A2UIComponent {
  /** Component type */
  type: string;
  /** Unique ID (A2UI may not always provide one) */
  id?: string;
  /** Component properties */
  props?: Record<string, unknown>;
  /** Child components (nested, not flat references) */
  children?: A2UIComponent[];
  /** Event handlers (A2UI uses string keys) */
  on?: Record<string, string>;
}

/**
 * Convert an A2UI payload to a Forge manifest.
 * 
 * A2UI uses a nested component tree. Forge uses a flat element map.
 * This adapter:
 * 1. Flattens the tree into a map with generated IDs
 * 2. Maps A2UI types to Forge types
 * 3. Translates A2UI props to Forge props
 */
export function a2uiToForge(payload: A2UIPayload): ForgeManifest {
  const elements: Record<string, ForgeElement> = {};
  let idCounter = 0;

  function flattenComponent(comp: A2UIComponent): string {
    const id = comp.id || `a2ui-${idCounter++}`;
    const forgeType = A2UI_TO_FORGE[comp.type];

    if (!forgeType || !isValidComponentType(forgeType)) {
      elements[id] = {
        type: 'Text' as ComponentType,
        props: { content: `[Unsupported A2UI type: ${comp.type}]`, variant: 'caption', colorScheme: 'secondary' },
      };
      return id;
    }

    const props = translateProps(comp.type, comp.props || {});

    // Convert nested children to flat references
    const childIds = (comp.children || []).map(child => flattenComponent(child));

    elements[id] = {
      type: forgeType,
      props,
      children: childIds.length > 0 ? childIds : undefined,
    };

    return id;
  }

  // Convert A2UI's nested tree to Forge's flat map (supports both "content" and "components")
  const components = payload.components || payload.content || [];
  const rootChildren = components.map(comp => flattenComponent(comp));

  // Create a root wrapper if there are multiple top-level components
  const rootId = rootChildren.length === 1 ? rootChildren[0] : 'a2ui-root';
  if (rootChildren.length > 1) {
    elements[rootId] = {
      type: 'Stack' as ComponentType,
      props: { gap: 'md' },
      children: rootChildren,
    };
  }

  return {
    manifest: '0.1.0',
    id: `a2ui-${Date.now()}`,
    root: rootId,
    elements,
    actions: {},
  };
}

/** Translate A2UI props to Forge props */
function translateProps(a2uiType: string, props: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...props };

  switch (a2uiType) {
    case 'heading':
      result.variant = 'heading';
      result.content = props.text || props.content || '';
      delete result.text;
      break;

    case 'text':
    case 'label':
      result.content = props.text || props.content || '';
      delete result.text;
      break;

    case 'row':
      result.direction = 'row';
      result.gap = props.gap || props.spacing || 'md';
      break;

    case 'column':
      result.direction = 'column';
      result.gap = props.gap || props.spacing || 'md';
      break;

    case 'container':
      result.gap = props.gap || props.spacing || 'md';
      break;

    case 'image':
      result.src = props.src || props.url || '';
      result.alt = props.alt || '';
      break;

    case 'button':
      result.label = props.text || props.label || '';
      result.variant = props.variant || props.style || 'default';
      break;

    case 'textInput':
      result.placeholder = props.placeholder || '';
      result.value = props.value || '';
      result.label = props.label || '';
      break;

    case 'numberInput':
      result.placeholder = props.placeholder || '';
      result.value = props.value ?? 0;
      result.label = props.label || '';
      break;

    case 'select':
      if (props.options && Array.isArray(props.options)) {
        result.options = props.options.map((opt: any) =>
          typeof opt === 'string' ? { value: opt, label: opt } : opt
        );
      }
      break;

    case 'alert':
      result.variant = props.type || props.severity || 'info';
      result.content = props.message || props.text || props.content || '';
      delete result.message;
      delete result.text;
      break;

    case 'progress':
      result.value = props.value ?? props.percent ?? 0;
      break;
  }

  return result;
}

/**
 * Detect if a JSON payload is an A2UI payload (vs a Forge manifest).
 * 
 * A2UI indicators:
 * - Has a `components` or `content` array (not `elements` object)
 * - Type field like "adaptive-card" or version string like "a2ui/v0.8"
 * - Component types that match A2UI vocabulary
 */
export function isA2UIPayload(data: unknown): data is A2UIPayload {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  // A2UI has a `components` or `content` array
  if (Array.isArray(obj.components) || Array.isArray(obj.content)) return true;

  // A2UI type identifier (e.g., "adaptive-card")
  if (typeof obj.type === 'string' && (obj.type === 'adaptive-card' || obj.type.startsWith('a2ui'))) return true;

  // A2UI version string
  if (typeof obj.version === 'string' && obj.version.startsWith('a2ui')) return true;

  // Has no `elements` (Forge) but has component-like structure — likely A2UI
  if (!obj.elements && !obj.manifest && Array.isArray(obj.content)) return true;

  return false;
}

/**
 * Ingest a payload — auto-detect A2UI vs Forge format.
 * Returns a valid Forge manifest in either case.
 */
export function ingestPayload(data: unknown): ForgeManifest {
  if (isA2UIPayload(data)) {
    return a2uiToForge(data as A2UIPayload);
  }
  // Already a Forge manifest — pass through
  return data as ForgeManifest;
}
