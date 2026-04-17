/**
 * Forge Core Types
 * 
 * The manifest format is a flat, ID-based JSON structure.
 * LLMs handle flat structures more reliably than nested trees.
 * Flat structures enable clean incremental patches (JSON Merge Patch).
 */

// ─── Component Types ─────────────────────────────────────────────

/** All component types in the Forge catalog */
export type ComponentType =
  // Layout (9)
  | 'Stack' | 'Grid' | 'Card' | 'Container' | 'Tabs' | 'Accordion' | 'Divider' | 'Spacer' | 'Repeater'
  // Content (6)
  | 'Text' | 'Image' | 'Icon' | 'Badge' | 'Avatar' | 'EmptyState'
  // Input (9)
  | 'TextInput' | 'NumberInput' | 'Select' | 'MultiSelect' | 'Checkbox'
  | 'Toggle' | 'DatePicker' | 'Slider' | 'FileUpload'
  // Action (3)
  | 'Button' | 'ButtonGroup' | 'Link'
  // Data Display (4)
  | 'Table' | 'List' | 'Chart' | 'Metric'
  // Feedback (4)
  | 'Alert' | 'Dialog' | 'Progress' | 'Toast'
  // Navigation (2)
  | 'Breadcrumb' | 'Stepper'
  // Drawing (1)
  | 'Drawing';

/** Component categories for grouping */
export type ComponentCategory = 'layout' | 'content' | 'input' | 'action' | 'data' | 'feedback' | 'navigation' | 'drawing';

// ─── Manifest ────────────────────────────────────────────────────

/** The top-level Forge manifest structure */
export interface ForgeManifest {
  /** Manifest format version (semver) */
  manifest: string;
  /** Unique app identifier */
  id: string;
  /** Root element ID (references an entry in elements) */
  root: string;
  /** Data schema definition (TinyBase tables schema) */
  schema?: ForgeSchema;
  /** Initial state values */
  state?: Record<string, unknown>;
  /** Flat map of element IDs to element definitions */
  elements: Record<string, ForgeElement>;
  /** Declarative action definitions */
  actions?: Record<string, ForgeAction>;
  /** App-level metadata */
  meta?: ForgeMeta;
  /** Persist state in IndexedDB (default: auto-detected from surface) */
  persistState?: boolean;
  /** Skip persistence entirely (chat artifacts) */
  skipPersistState?: boolean;
  /** Data access permissions for LLM read-back */
  dataAccess?: ForgeDataAccess;
}

/** Data access configuration for LLM read-back */
export interface ForgeDataAccess {
  /** Whether LLM can read app data (default: false) */
  enabled?: boolean;
  /** Tables the LLM can read */
  readable?: string[];
  /** Tables the LLM must never see */
  restricted?: string[];
  /** Use aggregated summaries instead of raw rows */
  summaries?: boolean;
}

/** App metadata */
export interface ForgeMeta {
  title?: string;
  description?: string;
  version?: number;
  author?: string;
  generator?: string; // e.g. "hermes-agent", "claude"
}

// ─── Element ─────────────────────────────────────────────────────

/** A single element in the manifest (flat, referenced by ID) */
export interface ForgeElement {
  /** Component type from the catalog */
  type: ComponentType;
  /** Component-specific properties (validated by Zod schemas) */
  props?: Record<string, unknown>;
  /** Child element IDs (references into the elements map) */
  children?: string[];
  /** Conditional visibility */
  visible?: VisibilityCondition;
}

/** Conditional visibility (declarative, no code) */
export interface VisibilityCondition {
  $when: {
    path: string;
    eq?: unknown;
    neq?: unknown;
    gt?: number;
    gte?: number;
    lt?: number;
    lte?: number;
    in?: unknown[];
    exists?: boolean;
  };
}

// ─── Schema ──────────────────────────────────────────────────────

/** Data schema (maps to TinyBase tables schema) */
export interface ForgeSchema {
  version: number;
  tables: Record<string, TableDefinition>;
  migrations?: Migration[];
}

/** A single table definition */
export interface TableDefinition {
  columns: Record<string, ColumnDefinition>;
}

/** Column type within a table */
export interface ColumnDefinition {
  type: 'string' | 'number' | 'boolean';
  default?: unknown;
}

/** Declarative schema migration */
export interface Migration {
  from: number;
  to: number;
  operations: MigrationOperation[];
}

/** A single migration operation */
export type MigrationOperation =
  | { op: 'add_column'; table: string; column: string; definition: ColumnDefinition }
  | { op: 'drop_column'; table: string; column: string }
  | { op: 'rename_column'; table: string; from: string; to: string }
  | { op: 'add_table'; table: string; definition: TableDefinition }
  | { op: 'drop_table'; table: string };

// ─── Actions ─────────────────────────────────────────────────────

/** Declarative action definition */
export interface ForgeAction {
  type: ActionType;
  /** Target state path */
  path?: string;
  /** Mutation operation */
  operation?: MutationOperation;
  /** Key for delete/lookup (supports template: {{id}}) */
  key?: string;
  /** Value to set (supports state references) */
  value?: unknown;
  /** Navigation target (element ID) */
  target?: string;
  /** URL for external navigation */
  url?: string;
  /** HTTP method for API calls */
  method?: string;
  /** Request body for API calls */
  body?: Record<string, unknown>;
  /** Arbitrary data payload */
  data?: Record<string, unknown>;
}

/** Action types */
export type ActionType =
  | 'mutateState'    // Modify TinyBase store
  | 'navigate'       // Switch active view
  | 'openDialog'     // Show a dialog element
  | 'closeDialog'    // Close current dialog
  | 'callApi'        // HTTP request (Ring 2+)
  | 'toast'          // Show a toast message
  | 'custom';        // Extension point

/** State mutation operations */
export type MutationOperation =
  | 'set'            // Set a value at path
  | 'append'         // Append a row to a table
  | 'delete'         // Delete a row by key
  | 'update'         // Update specific columns in a row
  | 'increment'      // Increment a numeric value
  | 'decrement'      // Decrement a numeric value
  | 'toggle';        // Toggle a boolean value

// ─── State Bindings ──────────────────────────────────────────────

/** State reference in a prop value: $state:path */
export interface StateRef {
  $state: string;
}

/** Computed reference in a prop value: $computed:expression */
export interface ComputedRef {
  $computed: string;
}

/** Item reference inside a Repeater: $item:field */
export interface ItemRef {
  $item: string;
}

/** Any reference type */
export type Ref = StateRef | ComputedRef | ItemRef;

/** Check if a value is a state reference ($state:...) */
export function isStateRef(value: unknown): value is StateRef {
  return typeof value === 'string' && value.startsWith('$state:');
}

/** Check if a value is a computed reference ($computed:...) */
export function isComputedRef(value: unknown): value is ComputedRef {
  return typeof value === 'string' && value.startsWith('$computed:');
}

/** Check if a value is an item reference ($item:...) */
export function isItemRef(value: unknown): value is ItemRef {
  return typeof value === 'string' && value.startsWith('$item:');
}

/** Check if a value is any reference */
export function isRef(value: unknown): value is Ref {
  return isStateRef(value) || isComputedRef(value) || isItemRef(value);
}

// ─── Surface ─────────────────────────────────────────────────────

/** Rendering surface mode */
export type SurfaceMode = 'chat' | 'standalone' | 'embed';

// ─── Events ──────────────────────────────────────────────────────

/** Custom event names used by Forge */
export interface ForgeEvents {
  'forge-action': CustomEvent<{ action: string; payload?: Record<string, unknown> }>;
  'forge-state-change': CustomEvent<{ path: string; value: unknown }>;
  'forge-error': CustomEvent<{ message: string; element?: string }>;
  'forge-ready': CustomEvent<{ appId: string }>;
}
