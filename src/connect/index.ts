/**
 * @forge/connect — MCP Server
 *
 * Provides MCP tools for LLM agents to create, update, and query Forge apps.
 *
 * Tools:
 *   - forge_create_app        — Create an app from a manifest, returns URL
 *   - forge_update_app        — Update an existing app (full or JSON Merge Patch)
 *   - forge_validate_manifest — Validate a manifest without creating an app
 *   - forge_component_docs    — Return the component catalog for LLM prompts
 *
 * Usage (stdio):
 *   node forge-connect.mjs
 *
 * Platform wrappers:
 *   - Claude Desktop: add to claude_desktop_config.json
 *   - VS Code: add to .vscode/mcp.json
 *   - Cursor: add to .cursorrules or MCP config
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { catalogPrompt, catalogToJsonSchema } from '../catalog/registry.js';
import { validateManifest } from '../validation/index.js';
import {
  initDatabase,
  createApp,
  getApp,
  listApps,
  updateApp,
  patchApp,
  deleteApp,
  generateAppId,
} from '../server/db.js';
import type { ForgeManifest } from '../types/index.js';

// ─── Create Server ─────────────────────────────────────────

const server = new McpServer({
  name: 'forge-connect',
  version: '1.0.0',
});

// ─── forge_create_app ──────────────────────────────────────

server.tool(
  'forge_create_app',
  'Create a new Forge app from a JSON manifest. The manifest defines the UI layout, data schema, and actions. Returns the app ID and shareable URL.',
  {
    manifest: z.object({}).passthrough().describe('A valid Forge manifest object following the Forge specification.'),
  },
  async ({ manifest }) => {
    try {
      // Validate first
      const validation = validateManifest(manifest);
      if (!validation.valid) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'Validation failed',
              errors: validation.errors,
              warnings: validation.warnings,
            }, null, 2),
          }],
          isError: true,
        };
      }

      const typed = manifest as unknown as ForgeManifest;
      if (!typed.id) {
        typed.id = generateAppId();
      }

      const stored = createApp(typed);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            id: stored.id,
            title: stored.title,
            url: `/apps/${stored.id}`,
            created_at: stored.created_at,
          }, null, 2),
        }],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Error creating app: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ─── forge_update_app ──────────────────────────────────────

server.tool(
  'forge_update_app',
  'Update an existing Forge app. Pass the full manifest to replace it, or a partial manifest to apply a JSON Merge Patch (RFC 7396).',
  {
    app_id: z.string().describe('The app ID to update.'),
    manifest: z.object({}).passthrough().describe('Full or partial manifest to apply.'),
    patch: z.boolean().optional().describe('If true, treat manifest as a JSON Merge Patch instead of full replacement. Default: true'),
  },
  async ({ app_id, manifest, patch: isPatch }) => {
    try {
      const usePatch = isPatch !== false; // default to true

      let stored;
      if (usePatch) {
        const result = patchApp(app_id, manifest as Partial<ForgeManifest>, (m) => {
          const v = validateManifest(m);
          return { valid: v.valid, errors: v.errors.map((e) => e.message) };
        });
        if (result.status === 'invalid') {
          return {
            content: [{ type: 'text', text: `Validation failed: ${result.errors.join(', ')}` }],
            isError: true,
          };
        }
        stored = result.status === 'ok' ? result.app : null;
      } else {
        const typed = manifest as unknown as ForgeManifest;
        typed.id = app_id;
        stored = updateApp(app_id, typed);
      }

      if (!stored) {
        return {
          content: [{ type: 'text', text: `App "${app_id}" not found.` }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            id: stored.id,
            title: stored.title,
            url: `/apps/${stored.id}`,
            updated_at: stored.updated_at,
          }, null, 2),
        }],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Error updating app: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ─── forge_validate_manifest ───────────────────────────────

server.tool(
  'forge_validate_manifest',
  'Validate a Forge manifest without creating an app. Returns validation errors and warnings.',
  {
    manifest: z.object({}).passthrough().describe('The manifest to validate.'),
  },
  async ({ manifest }) => {
    try {
      const result = validateManifest(manifest);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            valid: result.valid,
            errors: result.errors,
            warnings: result.warnings,
          }, null, 2),
        }],
        isError: !result.valid,
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Validation error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ─── forge_component_docs ──────────────────────────────────

server.tool(
  'forge_component_docs',
  'Get the Forge component catalog — all available component types, their props, and the manifest schema. Use this to understand what components are available when building Forge apps.',
  {
    tier: z.enum(['minimal', 'default', 'full']).optional().describe('Detail level. "minimal" = names only, "default" = types + names, "full" = complete schemas. Default: "full"'),
  },
  async ({ tier }) => {
    try {
      const prompt = catalogPrompt(tier || 'full');
      const schema = catalogToJsonSchema();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            prompt,
            schema,
            componentCount: Object.keys(schema.properties || {}).length,
          }, null, 2),
        }],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Error fetching catalog: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ─── forge_list_apps ───────────────────────────────────────

server.tool(
  'forge_list_apps',
  'List all hosted Forge apps, newest first.',
  {
    limit: z.number().optional().describe('Max apps to return (default: 20)'),
    offset: z.number().optional().describe('Offset for pagination (default: 0)'),
  },
  async ({ limit, offset }) => {
    try {
      const result = listApps(limit || 20, offset || 0);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            apps: result.apps.map(a => ({
              id: a.id,
              title: a.title,
              url: `/apps/${a.id}`,
              updated_at: a.updated_at,
            })),
            total: result.total,
          }, null, 2),
        }],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Error listing apps: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ─── forge_get_app ─────────────────────────────────────────

server.tool(
  'forge_get_app',
  'Get the full manifest of a specific Forge app by ID.',
  {
    app_id: z.string().describe('The app ID to retrieve.'),
  },
  async ({ app_id }) => {
    try {
      const stored = getApp(app_id);
      if (!stored) {
        return {
          content: [{ type: 'text', text: `App "${app_id}" not found.` }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            id: stored.id,
            title: stored.title,
            manifest: stored.manifest,
            created_at: stored.created_at,
            updated_at: stored.updated_at,
          }, null, 2),
        }],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Error getting app: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ─── forge_delete_app ──────────────────────────────────────

server.tool(
  'forge_delete_app',
  'Delete a Forge app by ID. This is permanent.',
  {
    app_id: z.string().describe('The app ID to delete.'),
  },
  async ({ app_id }) => {
    try {
      const deleted = deleteApp(app_id);
      if (!deleted) {
        return {
          content: [{ type: 'text', text: `App "${app_id}" not found.` }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, deleted: app_id }),
        }],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Error deleting app: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ─── Start Server ──────────────────────────────────────────

async function main() {
  // Init database
  const dbPath = process.env.FORGE_DB_PATH || './forge.db';
  initDatabase(dbPath);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🔥 Forge Connect MCP server running (stdio)');
}

main().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
