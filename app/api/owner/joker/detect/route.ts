import { NextResponse } from 'next/server';
import { getJoker } from '@/lib/server-config';
import { jokerBalance } from '@/lib/joker';

/**
 * POST /api/owner/joker/detect
 * Test JokerPanel connection using official API (POST /api/balance).
 * Returns balance + currency if credentials are valid.
 */
export async function POST() {
  const cfg = await getJoker();
  if (!cfg.apiId || !cfg.apiKey) {
    return NextResponse.json(
      { error: 'API ID / API Key JokerPanel belum diisi. Simpan dulu di Koneksi & API.' },
      { status: 400 }
    );
  }

  try {
    const json = await jokerBalance(cfg);
    return NextResponse.json({
      ok: true,
      balance: Number(json.balance ?? 0),
      currency: json.currency ?? 'IDR',
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal menghubungi JokerPanel' },
      { status: 400 }
    );
  }
}
