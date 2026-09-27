/**
 * SprintPedia API v2 Integration
 * 
 * Base URL: https://sprintpedia.id/api/v2
 * Auth: key (= api_key)
 * Format: POST form-urlencoded
 * 
 * Actions:
 * - services: Daftar layanan
 * - add: Order baru (service, link, quantity)
 * - status: Cek status (order: <id>)
 * - balance: Cek saldo
 * 
 * Referensi: Bot Telegram (SC AUTO ORDER NEWW/index.js)
 */

const BASE = 'https://sprintpedia.id/api/v2';

export interface SprintConfig {
  apiKey: string;
  secretKey: string;
}

/**
 * POST form-urlencoded ke SprintPedia API v2.
 * Mengikuti pola bot: key + action + extra params.
 */
async function post(action: string, extra: Record<string, any>, cfg: SprintConfig) {
  const payload: Record<string, string> = {
    key: cfg.apiKey,
    action: action,
  };
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null) payload[k] = String(v);
  }

  const params = new URLSearchParams(payload);
  
  console.log(`[SprintPedia] POST ${BASE} action=${action}`, JSON.stringify(payload));

  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const text = await res.text();
  console.log(`[SprintPedia] Response (${res.status}):`, text.substring(0, 500));

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      `Respons bukan JSON (status ${res.status}). Awalan: ${text.substring(0, 120)}`
    );
  }

  // API v2: status bisa boolean atau string
  if (json.status === false) {
    throw new Error(json.data || json.msg || json.error || 'SprintPedia error');
  }

  return json;
}

/** GET services → daftar layanan */
export const sprintServices = (cfg: SprintConfig) =>
  post('services', {}, cfg);

/**
 * Order baru ke SprintPedia.
 * action = 'add' (BUKAN 'order' — sesuai API v2 mapping di bot)
 * 
 * Params: service (ID layanan), link (target URL), quantity
 * Response sukses: { order: 12345 } atau { status: true, data: { id: 12345 } }
 */
export const sprintOrder = (
  cfg: SprintConfig,
  service: string,
  link: string,
  quantity: number,
  opts?: { custom_comments?: string; custom_link?: string }
) =>
  post('add', { 
    service, 
    link,  // Bot pakai 'link', bukan 'target'
    quantity: quantity.toString(),
    ...(opts?.custom_comments ? { comments: opts.custom_comments } : {}),
  }, cfg).then(json => {
    // Normalize response: v2 bisa return {order: ID} atau {data: {id, price}}
    const orderId = json.order || json.data?.id || json.id;
    const price = json.data?.price || json.price || 0;
    return {
      ...json,
      data: { id: orderId, price },
    };
  });

/**
 * Cek status order.
 * action = 'status', param = order: <id>
 * Response: { status, charge, remains, start_count, ... }
 */
export const sprintStatus = (cfg: SprintConfig, id: string) =>
  post('status', { order: id }, cfg);

/** Cek status bulk (multiple IDs) */
export const sprintStatusBulk = (cfg: SprintConfig, ids: string[]) =>
  post('status', { order: ids.join(',') }, cfg);

/** Refill order */
export const sprintRefill = (cfg: SprintConfig, id: string) =>
  post('refill', { order: id }, cfg);

/** Cek saldo SprintPedia */
export const sprintBalance = (cfg: SprintConfig) =>
  post('balance', {}, cfg);
