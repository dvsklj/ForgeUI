/**
 * Forge Core Types
 *
 * The manifest format is a flat, ID-based JSON structure.
 * LLMs handle flat structures more reliably than nested trees.
 * Flat structures enable clean incremental patches (JSON Merge Patch).
 */
/** All component types in the Forge catalog */
export type ComponentType = 'Stack' | 'Grid' | 'Card' | 'Container' | 'Tabs' | 'Accordion' | 'Divider' | 'Spacer' | 'Repeater' | 'Text' | 'Image' | 'Icon' | 'Badge' | 'Avatar' | 'EmptyState' | 'TextInput' | 'NumberInput' | 'Select' | 'MultiSelect' | 'Checkbox' | 'Toggle' | 'DatePicker' | 'Slider' | 'FileUpload' | 'Button' | 'ButtonGroup' | 'Link' | 'Table' | 'List' | 'Chart' | 'Metric' | 'Alert' | 'Dialog' | 'Progress' | 'Toast' | 'Breadcrumb' | 'Stepper' | 'Drawing';
/** Component categories for grouping */
export type ComponentCategory = 'layout' | 'content' | 'input' | 'action' | 'data' | 'feedback' | 'navigation' | 'drawing';
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
    generator?: string;
}
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
export type MigrationOperation = {
    op: 'add_column';
    table: string;
    column: string;
    definition: ColumnDefinition;
} | {
    op: 'drop_column';
    table: string;
    column: string;
} | {
    op: 'rename_column';
    table: string;
    from: string;
    to: string;
} | {
    op: 'add_table';
    table: string;
    definition: TableDefinition;
} | {
    op: 'drop_table';
    table: string;
};
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
export type ActionType = 'mutateState' | 'navigate' | 'openDialog' | 'closeDialog' | 'callApi' | 'toast' | 'custom';
/** State mutation operations */
export type MutationOperation = 'set' | 'append' | 'delete' | 'update' | 'increment' | 'decrement' | 'toggle';
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
export declare function isStateRef(value: unknown): value is StateRef;
/** Check if a value is a computed reference ($computed:...) */
export declare function isComputedRef(value: unknown): value is ComputedRef;
/** Check if a value is an item reference ($item:...) */
export declare function isItemRef(value: unknown): value is ItemRef;
/** Check if a value is any reference */
export declare function isRef(value: unknown): value is Ref;
/** Rendering surface mode */
export type SurfaceMode = 'chat' | 'standalone' | 'embed';
/** Custom event names used by Forge */
export interface ForgeEvents {
    'forgeui-action': CustomEvent<{
        action: string;
        payload?: Record<string, unknown>;
    }>;
    'forgeui-state-change': CustomEvent<{
        path: string;
        value: unknown;
    }>;
    'forgeui-error': CustomEvent<{
        message: string;
        element?: string;
    }>;
    'forgeui-ready': CustomEvent<{
        appId: string;
    }>;
}
//# sourceMappingURL=index.d.ts.map