import type { ForgeUIElement, ForgeUIManifest } from '../types/index.js';

type JsonObject = Record<string, unknown>;

export function migrateManifestFormat(input: unknown): ForgeUIManifest {
  if (!isObject(input)) return input as ForgeUIManifest;
  const manifestVersion = typeof input.manifest === 'string' ? input.manifest : '';
  const legacyVersion = /^0\.0(?:\.|$)/.test(manifestVersion);
  const missingVersion = !manifestVersion;
  const needsMigration =
    legacyVersion ||
    (missingVersion && (
      'version' in input ||
      'manifestVersion' in input ||
      'components' in input ||
      'rootElement' in input ||
      elementsNeedMigration(input.elements)
    ));
  if (!needsMigration) return input as unknown as ForgeUIManifest;

  const next: JsonObject = { ...input, manifest: '0.1.0' };
  delete next.version;
  delete next.manifestVersion;

  if (!next.elements && isObject(next.components)) {
    next.elements = next.components;
    delete next.components;
  }
  if (!next.root && typeof next.rootElement === 'string') {
    next.root = next.rootElement;
    delete next.rootElement;
  }

  if (isObject(next.elements)) {
    const elements: Record<string, ForgeUIElement> = {};
    for (const [id, element] of Object.entries(next.elements)) {
      if (!isObject(element)) continue;
      const migrated: JsonObject = { ...element };
      if (!migrated.type && typeof migrated.component === 'string') {
        migrated.type = migrated.component;
        delete migrated.component;
      }
      elements[id] = migrated as unknown as ForgeUIElement;
    }
    next.elements = elements;
  }
  return next as unknown as ForgeUIManifest;
}

function elementsNeedMigration(elements: unknown): boolean {
  if (!isObject(elements)) return false;
  return Object.values(elements).some((element) => isObject(element) && 'component' in element);
}

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
