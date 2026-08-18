/**
 * JokerPanel Official API Integration
 * Based on: jokerpanel.com/doc
 *
 * Auth: api_id (int) + api_key (string)
 * Format: POST form-urlencoded, response JSON { status: true/false, msg, ... }
 * Endpoints: /api/balance, /api/services, /api/order, /api/status, /api/refill
 */

const BASE = 'https://jokerpanel.com';

export interface JokerConfig {
  apiId: number;
  apiKey: string;
}

/**
 * POST form-urlencoded to JokerPanel.
 * Throws descriptive error if response is not JSON or status !== true.
 */
async function post(path: string, body: Record<string, any>) {
  const params = new URLSearchParams(
    Object.entries(body).map(([k, v]) => [k, String(v)])
  );
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
  return post('/api/balance', auth(cfg));
}

/** POST /api/services → { status, services: [...] } */
export async function jokerServices(cfg: JokerConfig) {
  return post('/api/services', auth(cfg));
}

/** POST /api/order → { status, order: id } */
export async function jokerOrder(
  cfg: JokerConfig,
  service: number,
  target: string,
  quantity: number
) {
  return post('/api/order', { ...auth(cfg), service, target, quantity });
}

/** POST /api/status → { status, order_status, ... } */
export async function jokerStatus(cfg: JokerConfig, order: number) {
  return post('/api/status', { ...auth(cfg), order });
}

/** POST /api/refill → { status, refill: id } */
export async function jokerRefill(cfg: JokerConfig, order: number) {
  return post('/api/refill', { ...auth(cfg), order });
}

/** POST /api/refill/status → { status, ... } */
export async function jokerRefillStatus(cfg: JokerConfig, refill: number) {
  return post('/api/refill/status', { ...auth(cfg), refill });
}
