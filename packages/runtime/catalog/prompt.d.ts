/**
 * Catalog prompt generator — three tiers for LLM system prompt injection.
 *
 * - minimal  (~800 tokens)  — manifest structure + component names only
 * - default  (~2400 tokens) — key components + state bindings + design tokens
 * - full     (~5000 tokens) — complete component reference from forgeui-llm-instructions.md
 */
export declare function catalogPrompt(tier?: 'minimal' | 'default' | 'full'): string;
/**
 * Generate a JSON Schema for Forge manifest validation.
 * Useful for structured output generation by LLMs.
 */
export declare function catalogToJsonSchema(): {
    type: string;
    required: string[];
    properties: Record<string, unknown>;
};
//# sourceMappingURL=prompt.d.ts.map