import crypto from 'crypto';
import { getDigiflazz, fetchJson } from '@/lib/server-config';

const BASE = 'https://api.digiflazz.com/v1';

/**
 * Ambil daftar harga produk Digiflazz
 * Reads credentials from Supabase settings (fallback: process.env)
 * Sign: md5(username + apiKey + "pricelist")
 */
export async function fetchPriceList(cmd: 'prepaid' | 'pasca' = 'prepaid'): Promise<DigiflazzProduct[]> {
  const cfg = await getDigiflazz();
  if (!cfg.username || !cfg.apiKey) {
    throw new Error('Konfigurasi Digiflazz belum ada. Simpan di halaman Koneksi & API.');
  }

  const sign = crypto
    .createHash('md5')
    .update(cfg.username + cfg.apiKey + 'pricelist')
    .digest('hex');

  const json = await fetchJson(`${BASE}/price-list`, {
    cmd,
    username: cfg.username,
    sign,
  });

  // Guard: wajib array — mencegah "e is not iterable"
  return Array.isArray(json?.data) ? json.data : [];
}

/**
 * Kirim transaksi top-up Digiflazz
 * Reads credentials from Supabase settings (fallback: process.env)
 * Sign: md5(username + apiKey + ref_id)
 */
export async function sendTopup(params: {
  buyer_sku_code: string;
  customer_no: string;
  ref_id: string;
  allow_dot?: boolean;
}): Promise<DigiflazzTransaction> {
  const cfg = await getDigiflazz();
  if (!cfg.username || !cfg.apiKey) {
    throw new Error('Konfigurasi Digiflazz belum ada. Simpan di halaman Koneksi & API.');
  }

  const testing = process.env.DIGIFLAZZ_TESTING === 'true';
  const sign = crypto
    .createHash('md5')
    .update(cfg.username + cfg.apiKey + params.ref_id)
    .digest('hex');

  const json = await fetchJson(`${BASE}/transaction`, {
    username: cfg.username,
    buyer_sku_code: params.buyer_sku_code,
    customer_no: params.customer_no,
    ref_id: params.ref_id,
    sign,
    allow_dot: params.allow_dot,
    testing,
  });

  return json.data as DigiflazzTransaction;
}

// === Types ===

export interface DigiflazzProduct {
  product_name: string;
  category: string;
  brand: string;
  type: string;
  seller_name: string;
  price: number;
  buyer_sku_code: string;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  start_cut_off: string;
  end_cut_off: string;
  desc: string;
}

export interface DigiflazzTransaction {
  ref_id: string;
  customer_no: string;
  buyer_sku_code: string;
  message: string;
  status: 'Sukses' | 'Pending' | 'Gagal';
  rc: string;
  sn: string;
  buyer_last_saldo: number;
  price: number;
  tele: string;
  wa: string;
}
