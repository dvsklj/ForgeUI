#!/usr/bin/env node
// Precompile MANIFEST_SCHEMA into a standalone validator.
// Writes src/validation/manifest-validator.generated.ts.

import { writeFileSync } from 'node:fs';
import Ajv from 'ajv';
import standaloneCode from 'ajv/dist/standalone/index.js';

// Mirror of the Ajv options in src/validation/index.ts createAjv().
// If you change createAjv() options, update these to match.
const ajv = new Ajv({
  strict: true,
  allErrors: true,
  removeAdditional: false,
  useDefaults: false,
  code: { source: true, esm: true },
});

// Import the schema. tsx handles .ts imports natively.
const { MANIFEST_SCHEMA } = await import('../src/validation/manifest-schema.ts');

const validateFn = ajv.compile(MANIFEST_SCHEMA);
const code = standaloneCode(ajv, validateFn);

const header = `/* eslint-disable */
// @ts-nocheck
// AUTO-GENERATED — do not edit. Regenerate via \`npm run gen:validator\`.
// Source: src/validation/manifest-schema.ts

`;

writeFileSync('src/validation/manifest-validator.generated.ts', header + code);
console.log('[gen] wrote src/validation/manifest-validator.generated.ts');
