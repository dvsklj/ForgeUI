/**
 * Client IP extraction with optional proxy trust.
 *
 * When FORGE_TRUST_PROXY is off (default), we use the raw socket address.
 * When on, we honor X-Forwarded-For / X-Real-IP — useful only when the
 * server is genuinely behind a reverse proxy.
 */

import type { Context } from 'hono';

export function getClientIp(c: Context, trustProxy: boolean): string {
  if (trustProxy) {
    const xff = c.req.header('x-forwarded-for');
    if (xff) {
      const first = xff.split(',')[0].trim();
      if (first) return first;
    }
    const xri = c.req.header('x-real-ip');
    if (xri) return xri.trim();
  }
  // @ts-ignore — Hono adapter surfaces vary; this works for @hono/node-server
  const addr = (c.env as any)?.incoming?.socket?.remoteAddress;
  return addr || 'unknown';
}
