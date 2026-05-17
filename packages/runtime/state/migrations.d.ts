import type { Store } from 'tinybase';
import type { ForgeUISchema } from '../types/index.js';
export declare const SCHEMA_VERSION_VALUE_ID = "__forgeui_schema_version";
export interface SchemaMigrationResult {
    migrated: boolean;
    missingStep?: number;
}
export declare function markSchemaVersion(store: Store, version: number): void;
export declare function applySchemaMigrations(store: Store, schema?: ForgeUISchema): SchemaMigrationResult;
//# sourceMappingURL=migrations.d.ts.map