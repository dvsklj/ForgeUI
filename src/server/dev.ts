/**
 * Forge Server — Dev Entry Point
 *
 * Runs the server directly via tsx (TypeScript execution) for development.
 * Usage: node src/server/dev.ts
 */

import { createForgeServer } from './index.js';

const server = createForgeServer({
  port: 3000,
  host: '0.0.0.0',
  dbPath: './forge.db',
});

process.on('SIGINT', () => { server.stop(); process.exit(0); });
process.on('SIGTERM', () => { server.stop(); process.exit(0); });

await server.start();
