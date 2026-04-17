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
import type { ForgeManifest } from '../types/index.js';
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
export declare function a2uiToForge(payload: A2UIPayload): ForgeManifest;
/**
 * Detect if a JSON payload is an A2UI payload (vs a Forge manifest).
 *
 * A2UI indicators:
 * - Has a `components` or `content` array (not `elements` object)
 * - Type field like "adaptive-card" or version string like "a2ui/v0.8"
 * - Component types that match A2UI vocabulary
 */
export declare function isA2UIPayload(data: unknown): data is A2UIPayload;
/**
 * Ingest a payload — auto-detect A2UI vs Forge format.
 * Returns a valid Forge manifest in either case.
 */
export declare function ingestPayload(data: unknown): ForgeManifest;
export {};
//# sourceMappingURL=index.d.ts.map