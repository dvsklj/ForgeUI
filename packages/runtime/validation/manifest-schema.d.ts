/**
 * Manifest JSON Schema definition.
 * Extracted so both the generator (scripts/gen-validator.mjs) and
 * src/validation/index.ts can import it without circular deps.
 */
export declare const MANIFEST_SCHEMA: {
    readonly type: "object";
    readonly required: readonly ["manifest", "id", "root", "elements"];
    readonly additionalProperties: false;
    readonly properties: {
        readonly manifest: {
            readonly type: "string";
            readonly pattern: "^0\\.\\d+\\.\\d+$";
        };
        readonly id: {
            readonly type: "string";
            readonly minLength: 1;
            readonly maxLength: 128;
        };
        readonly root: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly schema: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly version: {
                    readonly type: "integer";
                    readonly minimum: 1;
                };
                readonly tables: {
                    readonly type: "object";
                };
                readonly migrations: {
                    readonly type: "array";
                };
                readonly views: {
                    readonly type: "object";
                };
            };
        };
        readonly state: {
            readonly type: "object";
        };
        readonly elements: {
            readonly type: "object";
            readonly minProperties: 1;
            readonly additionalProperties: {
                readonly type: "object";
                readonly required: readonly ["type"];
                readonly additionalProperties: false;
                readonly properties: {
                    readonly type: {
                        readonly type: "string";
                        readonly enum: import("../index.js").ComponentType[];
                    };
                    readonly props: {
                        readonly type: "object";
                    };
                    readonly children: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly visible: {
                        readonly type: "object";
                    };
                };
            };
        };
        readonly actions: {
            readonly type: "object";
        };
        readonly meta: {
            readonly type: "object";
        };
        readonly persistState: {
            readonly type: "boolean";
        };
        readonly skipPersistState: {
            readonly type: "boolean";
        };
        readonly dataAccess: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly enabled: {
                    readonly type: "boolean";
                };
                readonly readable: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly restricted: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly summaries: {
                    readonly type: "boolean";
                };
            };
        };
    };
};
//# sourceMappingURL=manifest-schema.d.ts.map