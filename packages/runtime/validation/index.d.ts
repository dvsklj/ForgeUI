/**
 * Forge Validation Pipeline
 *
 * Four layers:
 * 1. JSON Schema validation (Ajv)
 * 2. URL allowlisting
 * 3. State path validation
 * 4. Component catalog enforcement
 */
/** Validation result */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}
export interface ValidationError {
    path: string;
    message: string;
    severity: 'error' | 'warning';
}
/**
 * Validate a Forge manifest through all four layers.
 * Reject — never repair — invalid manifests.
 */
export declare function validateManifest(data: unknown): ValidationResult;
/**
 * Validate a JSON Merge Patch envelope before it is merged into the stored manifest.
 * This is NOT a full manifest schema check — it guards the patch shape only.
 */
export declare function validateManifestPatch(patch: unknown): {
    valid: boolean;
    errors?: string[];
};
/**
 * Strip Markdown code fences from LLM output.
 *
 * LLMs routinely wrap JSON in ```json ... ``` fences.
 * This helper returns the unfenced string so callers can
 * pipe directly into JSON.parse → validateManifest.
 *
 * Never throws. Returns input unchanged if no fence is found.
 */
export declare function extractManifest(rawText: string): string;
//# sourceMappingURL=index.d.ts.map