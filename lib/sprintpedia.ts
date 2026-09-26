/**
 * SprintPedia API Integration
 * Base URL: https://sprintpedia.id/api/{aksi}
 *
 * Auth: api_key + secret_key (no IP whitelist needed)
 * Format: POST JSON, response { status: true/false, data, msg?, orders? }
 *
 * Endpoints: /services, /order, /status, /refill, /refill_status
 */

const BASE = 'https://sprintpedia.id/api';

export interface SprintConfig {
  apiKey: string;
  secretKey: string;
}

/**
 * POST JSON to SprintPedia.
 * Throws descriptive error if response status !== true.
 * Error messages live in `data` (string) when status is false.
 */
async function post(path: string, body: Record<string, any>, cfg: SprintConfig) {
  const payload = { api_key: cfg.apiKey, secret_key: cfg.secretKey, ...body };
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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

  if (json.status !== true) {
    throw new Error(json.data || json.msg || 'Gagal: ' + path);
  }
  return json;
}

/** GET /services → { status: true, data: [...] } */
export const sprintServices = (cfg: SprintConfig) =>
  post('/services', {}, cfg);

/** POST /order → { status: true, data: { id, price } } */
export const sprintOrder = (
  cfg: SprintConfig,
  service: string,
  target: string,
  quantity: number,
  opts?: { custom_comments?: string; custom_link?: string }
) =>
  post('/order', { service, target, quantity, ...opts }, cfg);

/** POST /status (single ID) → { status: true, data: { id, status, charge, start_count, remains } } */
export const sprintStatus = (cfg: SprintConfig, id: string) =>
  post('/status', { id }, cfg);

/** POST /status (bulk, max 100 IDs) → { status: true, orders: { "1107": {...}, ... } } */
export const sprintStatusBulk = (cfg: SprintConfig, ids: string[]) =>
  post('/status', { id: ids.join(',') }, cfg);

/** POST /refill → { status: true, data: { id } } */
export const sprintRefill = (cfg: SprintConfig, id: string) =>
  post('/refill', { id }, cfg);

/** POST /refill_status → { status: true, data: { status } } */
export const sprintRefillStatus = (cfg: SprintConfig, id: string) =>
  post('/refill_status', { id }, cfg);
