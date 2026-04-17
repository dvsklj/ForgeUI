#!/bin/bash
# Build and prepare all packages for npm publishing
set -e

echo "=== Building ==="
npm run build

echo ""
echo "=== Preparing packages ==="

# @forgeui/runtime
echo "  @forgeui/runtime..."
cp dist/forge.js packages/runtime/
cp dist/forge-standalone.js packages/runtime/
cp dist/forge-components.js packages/runtime/
echo "    forge.js: $(du -h packages/runtime/forge.js | cut -f1)"

# @forgeui/server
echo "  @forgeui/server..."
mkdir -p packages/server/dist
cp dist/forge-server.js packages/server/dist/
cp dist/forge.mjs packages/server/dist/
echo "    forge-server.js: $(du -h packages/server/dist/forge-server.js | cut -f1)"

# @forgeui/catalog
echo "  @forgeui/catalog..."
cp dist/forge-catalog.js packages/catalog/
echo "    forge-catalog.js: $(du -h packages/catalog/forge-catalog.js | cut -f1)"

# @forgeui/connect
echo "  @forgeui/connect..."
cp dist/forge-connect.mjs packages/connect/
echo "    forge-connect.mjs: $(du -h packages/connect/forge-connect.mjs | cut -f1)"

echo ""
echo "=== Packages ready ==="
echo ""
echo "To publish:"
echo "  cd packages/runtime  && npm publish --access public"
echo "  cd packages/catalog  && npm publish --access public"
echo "  cd packages/server   && npm publish --access public"
echo "  cd packages/connect  && npm publish --access public"
echo ""
echo "Dry run:"
echo "  cd packages/runtime  && npm pack --dry-run"
