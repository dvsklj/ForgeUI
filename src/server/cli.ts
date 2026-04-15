/**
 * Forge Server — CLI Entry Point
 *
 * Usage: node forge-server.js [--port 3000] [--host 0.0.0.0] [--db ./forge.db]
 */

import { parseArgs } from 'util';
import { createForgeServer } from './index.js';

const { values } = parseArgs({
  options: {
    port: { type: 'string', default: '3000' },
    host: { type: 'string', default: '0.0.0.0' },
    db: { type: 'string', default: './forge.db' },
  },
  allowPositionals: false,
});

const server = createForgeServer({
  port: parseInt(values.port!),
  host: values.host!,
  dbPath: values.db!,
});

// Graceful shutdown
process.on('SIGINT', () => { server.stop(); process.exit(0); });
process.on('SIGTERM', () => { server.stop(); process.exit(0); });

await server.start();
