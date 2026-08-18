import { getJoker } from '@/lib/server-config';
import { jokerServices, jokerOrder, jokerStatus, type JokerConfig } from '@/lib/joker';

/**
 * JokerPanel provider — uses official API format (api_id + api_key).
 * All functions read config from Supabase settings via server-config.
 */

async function getCfg(): Promise<JokerConfig> {
  const cfg = await getJoker();
  if (!cfg.apiId || !cfg.apiKey) {
    throw new Error('API ID / API Key JokerPanel belum diisi. Simpan di halaman Koneksi & API.');
  }
  return cfg;
}

/** Ambil semua layanan yang tersedia — POST /api/services */
export async function getServices(): Promise<JokerService[]> {
  const cfg = await getCfg();
  const json = await jokerServices(cfg);
  const list = json.services || json.data || json;
  return Array.isArray(list) ? list : [];
}

/** Kirim order SMM — POST /api/order */
export async function addOrder(service: number, target: string, quantity: number) {
  const cfg = await getCfg();
  return jokerOrder(cfg, service, target, quantity) as Promise<{ order: number }>;
}

/** Cek status order — POST /api/status */
export async function getOrderStatus(order: number) {
  const cfg = await getCfg();
  return jokerStatus(cfg, order) as Promise<JokerOrderStatus>;
}

// === Types ===

export interface JokerService {
  id: number;
  name: string;
  type: string;
  price: string;
  min: string | number;
  max: string | number;
  description: string;
  category: string;
  refill: boolean;
  cancel: boolean;
}

export interface JokerOrderStatus {
  order: number;
  order_status: 'pending' | 'processing' | 'completed' | 'canceled' | 'partial';
  charge: string;
  start_count: string;
  remains: string;
  currency: string;
}
