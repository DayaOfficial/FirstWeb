import { getJoker, fetchJson } from '@/lib/server-config';

/**
 * Internal call helper — reads credentials from Supabase settings (fallback: process.env)
 */
async function call(payload: Record<string, unknown>) {
  const cfg = await getJoker();
  if (!cfg.key) {
    throw new Error('Konfigurasi JokerPanel belum ada. Simpan di halaman Koneksi & API.');
  }
  return fetchJson(cfg.base, { key: cfg.key, ...payload });
}

/** Ambil semua layanan yang tersedia */
export async function getServices(): Promise<JokerService[]> {
  const json = await call({ action: 'services' });
  // Guard: wajib array — mencegah "e is not iterable"
  return Array.isArray(json) ? json : [];
}

/** Kirim order SMM */
export async function addOrder(service: number, link: string, quantity: number) {
  return call({ action: 'add', service, link, quantity }) as Promise<{ order: number }>;
}

/** Cek status order */
export async function getOrderStatus(order: number) {
  return call({ action: 'status', order }) as Promise<JokerOrderStatus>;
}

// === Types ===

export interface JokerService {
  service: number;
  name: string;
  type: string;
  rate: string;
  min: string;
  max: string;
  dripfeed: boolean;
  refill: boolean;
  cancel: boolean;
  category: string;
}

export interface JokerOrderStatus {
  order: number;
  status: 'Pending' | 'In progress' | 'Completed' | 'Partial' | 'Canceled';
  charge: string;
  start_count: string;
  remains: string;
  currency: string;
}
