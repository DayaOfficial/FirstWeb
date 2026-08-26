/**
 * JokerPanel Official API Integration
 * Based on: jokerpanel.com/doc
 *
 * Auth: api_id (int) + api_key (string)
 * Format: POST form-urlencoded, response JSON { status: true/false, msg, ... }
 * Endpoints: /api/balance, /api/services, /api/order, /api/status, /api/refill
 *
 * Supports optional relay for static IP egress (serverless environments).
 */

const DEFAULT_BASE = 'https://jokerpanel.com';

export interface JokerConfig {
  apiId: number;
  apiKey: string;
  relay?: string;        // e.g. 'http://VPS_IP:8080' — if set, requests go via relay
  relaySecret?: string;  // shared secret for relay auth
}

/**
 * POST form-urlencoded to JokerPanel (or relay).
 * Throws descriptive error if response is not JSON or status !== true.
 */
async function post(path: string, body: Record<string, any>, cfg: JokerConfig) {
  const base = cfg.relay || DEFAULT_BASE;
  const params = new URLSearchParams(
    Object.entries(body).map(([k, v]) => [k, String(v)])
  );

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  // If using relay, send auth header
  if (cfg.relay && cfg.relaySecret) {
    headers['x-relay-secret'] = cfg.relaySecret;
  }

  const res = await fetch(base + path, {
    method: 'POST',
    headers,
    body: params.toString(),
  });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      `Respons bukan JSON (status ${res.status}) dari ${path}. Awalan: ${text.substring(0, 120)}`
    );
  }
  if (json.status === false) {
    throw new Error(json.msg || `JokerPanel error pada ${path}`);
  }
  return json;
}

function auth(cfg: JokerConfig) {
  return { api_id: cfg.apiId, api_key: cfg.apiKey };
}

/** POST /api/balance → { status, balance, currency } */
export async function jokerBalance(cfg: JokerConfig) {
  return post('/api/balance', auth(cfg), cfg);
}

/** POST /api/services → { status, services: [...] } */
export async function jokerServices(cfg: JokerConfig) {
  return post('/api/services', auth(cfg), cfg);
}

/** POST /api/order → { status, order: id } */
export async function jokerOrder(
  cfg: JokerConfig,
  service: number,
  target: string,
  quantity: number
) {
  return post('/api/order', { ...auth(cfg), service, target, quantity }, cfg);
}

/** POST /api/status → { status, order_status, ... } */
export async function jokerStatus(cfg: JokerConfig, order: number) {
  return post('/api/status', { ...auth(cfg), order }, cfg);
}

/** POST /api/refill → { status, refill: id } */
export async function jokerRefill(cfg: JokerConfig, order: number) {
  return post('/api/refill', { ...auth(cfg), order }, cfg);
}

/** POST /api/refill/status → { status, ... } */
export async function jokerRefillStatus(cfg: JokerConfig, refill: number) {
  return post('/api/refill/status', { ...auth(cfg), refill }, cfg);
}
