import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { getDigiflazz, fetchJson } from '@/lib/server-config';

/**
 * GET /api/owner/digiflazz/raw
 *
 * Diagnostik: menampilkan jumlah raw produk yang dikembalikan API Digiflazz
 * tanpa menyimpan apa pun. Membuktikan apakah "0 produk" karena akun atau kode.
 */
export async function GET() {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const cfg = await getDigiflazz();
  if (!cfg.username || !cfg.apiKey) {
    return NextResponse.json({ error: 'Konfigurasi Digiflazz belum ada. Isi di Koneksi & API.' }, { status: 400 });
  }

  const sign = crypto.createHash('md5').update(cfg.username + cfg.apiKey + 'pricelist').digest('hex');

  let pre: Record<string, unknown> = {};
  let pas: Record<string, unknown> = {};

  try {
    pre = await fetchJson('https://api.digiflazz.com/v1/price-list', {
      cmd: 'prepaid', username: cfg.username, sign,
    });
  } catch (e: unknown) {
    pre = { error: e instanceof Error ? e.message : 'Gagal fetch prepaid' };
  }

  try {
    pas = await fetchJson('https://api.digiflazz.com/v1/price-list', {
      cmd: 'pasca', username: cfg.username, sign,
    });
  } catch (e: unknown) {
    pas = { error: e instanceof Error ? e.message : 'Gagal fetch pasca' };
  }

  const prepaidData = Array.isArray((pre as Record<string, unknown>)?.data) ? (pre as Record<string, unknown[]>).data : [];
  const pascaData = Array.isArray((pas as Record<string, unknown>)?.data) ? (pas as Record<string, unknown[]>).data : [];

  // Group prepaid by category
  const categoryCount: Record<string, number> = {};
  for (const item of prepaidData as Record<string, string>[]) {
    const cat = item.category || 'unknown';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  }

  // Group pasca by category
  const pascaCategoryCount: Record<string, number> = {};
  for (const item of pascaData as Record<string, string>[]) {
    const cat = item.category || 'unknown';
    pascaCategoryCount[cat] = (pascaCategoryCount[cat] || 0) + 1;
  }

  return NextResponse.json({
    username: cfg.username,
    prepaid_count: prepaidData.length,
    pasca_count: pascaData.length,
    prepaid_categories: categoryCount,
    pasca_categories: pascaCategoryCount,
    prepaid_message: (pre as Record<string, unknown>).message || null,
    pasca_message: (pas as Record<string, unknown>).message || null,
    sample_prepaid: (prepaidData as unknown[]).slice(0, 5),
    sample_pasca: (pascaData as unknown[]).slice(0, 5),
    hint: prepaidData.length < 20
      ? 'Jumlah produk kecil. Aktifkan lebih banyak produk di dashboard Digiflazz (Atur Harga), lalu sinkron ulang.'
      : undefined,
  });
}
