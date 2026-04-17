/**
 * Forge State Layer
 *
 * Wraps TinyBase for reactive state management.
 * - Creates store from manifest schema
 * - Resolves $state:, $computed:, $item: references
 * - Supports progressive persistence (in-memory → IndexedDB → sync)
 */
import { Store } from 'tinybase';
export interface ForgeStateConfig {
    schema?: {
        version: number;
        tables: Record<string, {
            columns: Record<string, {
                type: 'string' | 'number' | 'boolean';
                default?: unknown;
            }>;
        }>;
    };
    initialState?: Record<string, unknown>;
}
export declare function setItemContext(item: Record<string, unknown> | null): void;
export declare function getItemContext(): Record<string, unknown> | null;
/**
 * Resolve any reference string to its actual value.
 * - $state:path → store value
 * - $computed:expression → computed value
 * - $item:field → current repeater item field
 * - $expr:expression → expression evaluated against store and item context
 * - {{state.x}} / {{item.x}} → interpolated string
 * - Plain value → returned as-is
 */
export declare function resolveRef(store: Store, value: unknown): unknown;
/** Create a Forge state store from config */
export declare function createForgeUIStore(config: ForgeStateConfig): Store;
/** Execute a declarative action against the store */
export declare function executeAction(store: Store, action: {
    type: string;
    path?: string;
    operation?: string;
    key?: string;
    value?: unknown;
}): boolean;
//# sourceMappingURL=index.d.ts.map