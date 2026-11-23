// Total Love: the portfolio's global appreciation counter.
//
//   GET  /api/love               → { count }
//   POST /api/love { count: n }  → { count }  (n = 1–10 hearts sent in one go)
//
// The total lives in Upstash Redis and is only ever changed here, with INCRBY,
// which is atomic: simultaneous visitors can never overwrite each other's hearts.
// Redis is reached over its REST API with fetch, so no SDK is needed.
//
// Rate limiting: each visitor (a salted SHA-256 hash of their IP address; the IP
// itself is never stored) may send up to 30 hearts a minute and 300 a day. Both
// windows expire on their own. Hearts over the limit are refused with 429 and
// the current total, so the page can say so instead of showing a wrong number.
//
// Configuration (Vercel → Project → Settings → Environment Variables; adding
// Upstash from the Vercel Marketplace sets the first two for you):
//   KV_REST_API_URL / KV_REST_API_TOKEN   (or UPSTASH_REDIS_REST_URL / _TOKEN)
//   LOVE_SALT                             optional; salt for the IP hash

import { createHash } from 'node:crypto';
import process from 'node:process';

const TOTAL_KEY = 'love:total';
const MAX_PER_REQUEST = 10;
const LIMITS = [
  { name: 'minute', seconds: 60, max: 30 },
  { name: 'day', seconds: 86_400, max: 300 },
];
const MAX_BODY_BYTES = 256;

// ── Store ──────────────────────────────────────────────────────────────────

// Runs Redis commands in one round trip. Returns each command's result.
export function createUpstashStore({ url, token }) {
  return async (commands) => {
    const response = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
    });
    if (!response.ok) throw new Error(`Store responded ${response.status}`);
    const results = await response.json();
    return results.map((item) => {
      if (item.error) throw new Error('Store command failed');
      return item.result;
    });
  };
}

function getStoreFromEnv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { run: createUpstashStore({ url, token }), salt: process.env.LOVE_SALT || token };
}

// ── Request helpers ────────────────────────────────────────────────────────

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

// Vercel parses JSON bodies; a plain Node server (the local dev server) does not.
async function readBody(req) {
  if (req.body !== undefined) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY_BYTES) throw new Error('Body too large');
  }
  return raw ? JSON.parse(raw) : {};
}

// Hearts can only be sent from the portfolio itself: browsers always attach an
// Origin header to a POST, and it must name this same host.
function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

// On Vercel, x-real-ip is set by the platform to the visitor's address.
function getVisitorId(req, salt) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = req.headers['x-real-ip'] || forwarded || req.socket?.remoteAddress || 'unknown';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 24);
}

// ── Handler ────────────────────────────────────────────────────────────────

export function createLoveHandler(getStore = getStoreFromEnv) {
  return async function handler(req, res) {
    const store = getStore();
    if (!store) return send(res, 503, { error: 'unavailable' });

    try {
      if (req.method === 'GET') {
        const [total] = await store.run([['GET', TOTAL_KEY]]);
        return send(res, 200, { count: Number(total) || 0 });
      }

      if (req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return send(res, 405, { error: 'method' });
      }
      if (!isSameOrigin(req)) return send(res, 403, { error: 'origin' });
      if (!String(req.headers['content-type'] || '').startsWith('application/json')) {
        return send(res, 415, { error: 'type' });
      }

      let body;
      try {
        body = await readBody(req);
      } catch {
        return send(res, 400, { error: 'body' });
      }
      const amount = body?.count;
      if (!Number.isInteger(amount) || amount < 1 || amount > MAX_PER_REQUEST) {
        return send(res, 400, { error: 'count' });
      }

      // Count these hearts against the visitor's windows first.
      const visitor = getVisitorId(req, store.salt);
      const limitCommands = LIMITS.flatMap(({ name, seconds }) => {
        const key = `love:limit:${name}:${visitor}`;
        return [
          ['INCRBY', key, amount],
          ['EXPIRE', key, seconds, 'NX'],
        ];
      });
      const limitResults = await store.run(limitCommands);
      const isOverLimit = LIMITS.some(({ max }, i) => Number(limitResults[i * 2]) > max);

      if (isOverLimit) {
        const [total] = await store.run([['GET', TOTAL_KEY]]);
        res.setHeader('Retry-After', '60');
        return send(res, 429, { error: 'limit', count: Number(total) || 0 });
      }

      const [total] = await store.run([['INCRBY', TOTAL_KEY, amount]]);
      return send(res, 200, { count: Number(total) });
    } catch {
      return send(res, 502, { error: 'store' });
    }
  };
}

export default createLoveHandler();
