import crypto from 'crypto';

const BASE = 'https://api.digiflazz.com/v1';

function sign(ref: string) {
  return crypto
    .createHash('md5')
    .update(process.env.DIGIFLAZZ_USERNAME! + process.env.DIGIFLAZZ_API_KEY! + ref)
    .digest('hex');
}

/**
 * Ambil daftar harga produk Digiflazz
 * Sign: md5(username + apiKey + "pricelist")
 */
export async function fetchPriceList(cmd: 'prepaid' | 'pasca' = 'prepaid') {
  const res = await fetch(`${BASE}/price-list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cmd,
      username: process.env.DIGIFLAZZ_USERNAME,
      sign: sign('pricelist'),
    }),
  });
  const json = await res.json();
  return (json.data ?? []) as DigiflazzProduct[];
}

/**
 * Kirim transaksi top-up Digiflazz
 * Sign: md5(username + apiKey + ref_id)
 */
export async function sendTopup(params: {
  buyer_sku_code: string;
  customer_no: string;
  ref_id: string;
  allow_dot?: boolean;
}) {
  const testing = process.env.DIGIFLAZZ_TESTING === 'true';
  const res = await fetch(`${BASE}/transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.DIGIFLAZZ_USERNAME,
      buyer_sku_code: params.buyer_sku_code,
      customer_no: params.customer_no,
      ref_id: params.ref_id,
      sign: sign(params.ref_id),
      allow_dot: params.allow_dot,
      testing,
    }),
  });
  const json = await res.json();
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
