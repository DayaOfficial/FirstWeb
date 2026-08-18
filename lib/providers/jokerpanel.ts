import { getJoker } from '@/lib/server-config';
import { postForm } from '@/lib/joker';

/**
 * Internal call helper — reads credentials from Supabase settings (fallback: process.env).
 * Uses form-urlencoded (not JSON) because most SMM panels expect $_POST.
 */
async function call(payload: Record<string, string>) {
  const cfg = await getJoker();
  if (!cfg.key) {
    throw new Error('Konfigurasi JokerPanel belum ada. Simpan di halaman Koneksi & API.');
  }
  const r = await postForm(cfg.base, { key: cfg.key, ...payload });
  if (r.json === null) {
    throw new Error(
      `Respons bukan JSON dari ${cfg.base} (status ${r.status}). Jalankan "Deteksi Endpoint" di halaman Koneksi API.`
    );
  }
  if (r.json?.error) {
    throw new Error(`JokerPanel error: ${r.json.error}`);
  }
  return r.json;
}

/** Ambil semua layanan yang tersedia */
export async function getServices(): Promise<JokerService[]> {
  const json = await call({ action: 'services' });
  // Guard: wajib array — mencegah "e is not iterable"
  return Array.isArray(json) ? json : [];
}

/** Kirim order SMM */
export async function addOrder(service: number, link: string, quantity: number) {
  return call({
    action: 'add',
    service: String(service),
    link,
    quantity: String(quantity),
  }) as Promise<{ order: number }>;
}

/** Cek status order */
export async function getOrderStatus(order: number) {
  return call({ action: 'status', order: String(order) }) as Promise<JokerOrderStatus>;
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
