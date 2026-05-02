/**
 * ForgeUIElement — Base class for all Forge components
 *
 * Provides state binding resolution, action dispatching,
 * and common styles. No decorators — uses Lit's static properties API.
 */
import { LitElement } from 'lit';
import type { CSSResult } from 'lit';
import type { Store } from 'tinybase';
export declare class ForgeUIElement extends LitElement {
    /** Monotonic counter for generating unique instance IDs */
    static _instanceCounter: number;
    /** Stable unique ID for this component instance — used for label linkage */
    protected readonly _instanceId: string;
    /** Resolved component props from the manifest */
    props: Record<string, unknown>;
    /** TinyBase store instance */
    store: Store | null;
    /** Action callback */
    onAction: ((actionId: string, payload?: Record<string, unknown>) => void) | null;
    /** Current repeater item context */
    itemContext: Record<string, unknown> | null;
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    connectedCallback(): void;
    /** Resolve a reference ($state:, $computed:, $item:) to its value */
    protected resolve(value: unknown): unknown;
    /** Get a prop value, resolving any references */
    protected getProp(key: string): unknown;
    /** Get a prop as an array, resolving any references */
    protected getArray(key: string): unknown[];
    /** Get a prop as a string */
    protected getString(key: string, fallback?: string): string;
    /** Get a prop as a number */
    protected getNumber(key: string, fallback?: number): number;
    /** Get a prop as a boolean */
    protected getBool(key: string, fallback?: boolean): boolean;
    /** Get the current value from a two-way bind prop, falling back to a normal prop. */
    protected getBoundProp(key: string, fallback?: unknown): unknown;
    /** Dispatch a forgeui-action event */
    protected dispatchAction(actionId: string, payload?: Record<string, unknown>): void;
    /** Handle a button/action click by looking up the action prop */
    protected handleAction(_event: Event): void;
    /** Alias: get a prop value (compat with generated code) */
    protected prop(key: string): unknown;
    /** Alias: shared styles for all Forge components */
    static get sharedStyles(): CSSResult[];
    /** Alias: resolve gap token to CSS value */
    protected gapValue(gap?: string | number): string;
    static get styles(): CSSResult | CSSResult[];
}
//# sourceMappingURL=base.d.ts.map