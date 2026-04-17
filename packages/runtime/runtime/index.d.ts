/**
 * ForgeUIApp — The core web component entry point
 *
 * <forgeui-app manifest='...' surface='chat|standalone|embed' color-scheme='light|dark'></forgeui-app>
 *
 * Creates a TinyBase store, validates the manifest, and renders the element tree.
 */
import { LitElement } from 'lit';
import { Store } from 'tinybase';
import type { ForgeUIManifest, SurfaceMode } from '../types/index.js';
import { ValidationResult } from '../validation/index.js';
import { type PersisterStatus } from './persister.js';
import { type UndoRedoState } from './undo-redo.js';
import '../components/index.js';
export declare class ForgeUIApp extends LitElement {
    static styles: import("lit").CSSResult[];
    static get properties(): {
        manifest: {
            type: ObjectConstructor;
        };
        src: {
            type: StringConstructor;
        };
        surface: {
            type: StringConstructor;
            reflect: boolean;
        };
        colorScheme: {
            type: StringConstructor;
            reflect: boolean;
        };
    };
    manifest?: ForgeUIManifest;
    src?: string;
    surface: SurfaceMode;
    colorScheme?: 'light' | 'dark';
    private _activeView;
    private _store?;
    private _validation?;
    private _parsedManifest?;
    private _persister;
    private _undoStack;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): Promise<void>;
    /** Read manifest from an inline <script type="application/json"> child */
    private _readInlineManifest;
    updated(changed: Map<string, unknown>): void;
    private _initManifest;
    render(): import("lit-html").TemplateResult;
    private _renderErrors;
    /** ─── Persistence ──────────────────────────────────────────── */
    private _setupPersistence;
    /** Get persistence status. */
    getPersistenceStatus(): PersisterStatus | null;
    private _handleAction;
    getStore(): Store | undefined;
    getManifest(): ForgeUIManifest | undefined;
    getValidation(): ValidationResult | undefined;
    dispatchAction(actionId: string, payload?: Record<string, unknown>): void;
    /** Push a manifest update to the undo stack (for LLM-driven updates). */
    pushManifestUpdate(manifest: ForgeUIManifest): void;
    /** Undo the last manifest change. Returns the restored manifest, or null. */
    undo(): ForgeUIManifest | null;
    /** Redo an undone manifest change. Returns the restored manifest, or null. */
    redo(): ForgeUIManifest | null;
    /** Get undo/redo state. */
    getUndoRedoState(): UndoRedoState;
    static catalogPrompt(tier?: 'minimal' | 'default' | 'full'): string;
    static catalogJsonSchema(): object;
}
declare global {
    interface HTMLElementTagNameMap {
        'forgeui-app': ForgeUIApp;
    }
}
//# sourceMappingURL=index.d.ts.map