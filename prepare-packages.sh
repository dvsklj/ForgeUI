#!/bin/bash
# Build and prepare all packages for npm publishing
set -e

echo "=== Building ==="
npm run build

echo ""
echo "=== Preparing packages ==="

# @forgeui/runtime — types are already emitted by build to packages/runtime/
echo "  @forgeui/runtime..."
cp dist/forgeui.js packages/runtime/
cp dist/forgeui-standalone.js packages/runtime/
cp dist/forgeui-components.js packages/runtime/
echo "    forgeui.js: $(du -h packages/runtime/forgeui.js | cut -f1)"
echo "    forgeui-standalone.js: $(du -h packages/runtime/forgeui-standalone.js | cut -f1)"

# @forgeui/server — types are already emitted by build to packages/server/dist/
echo "  @forgeui/server..."
mkdir -p packages/server/dist
cp dist/forgeui-server.js packages/server/dist/
cp dist/forgeui-cli.js packages/server/dist/
echo "    forgeui-server.js: $(du -h packages/server/dist/forgeui-server.js | cut -f1)"
echo "    forgeui-cli.js: $(du -h packages/server/dist/forgeui-cli.js | cut -f1)"

# @forgeui/catalog — types are already emitted by build to packages/catalog/
echo "  @forgeui/catalog..."
cp dist/forgeui-catalog.js packages/catalog/
echo "    forgeui-catalog.js: $(du -h packages/catalog/forgeui-catalog.js | cut -f1)"

# @forgeui/connect
echo "  @forgeui/connect..."
cp dist/forgeui-connect.mjs packages/connect/
echo "    forgeui-connect.mjs: $(du -h packages/connect/forgeui-connect.mjs | cut -f1)"

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
