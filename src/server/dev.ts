/**
 * Forge Server — Dev Entry Point
 *
 * Runs the server directly via tsx (TypeScript execution) for development.
 * Usage: node src/server/dev.ts
 */

import { createForgeUIServer } from './index.js';

const server = createForgeUIServer({
  port: 3000,
  host: '0.0.0.0',
  dbPath: './forgeui.db',
});

process.on('SIGINT', () => { server.stop(); process.exit(0); });
process.on('SIGTERM', () => { server.stop(); process.exit(0); });

await server.start();
