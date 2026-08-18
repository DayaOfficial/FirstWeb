import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDigiflazz, fetchJson } from '@/lib/server-config';

/**
 * POST /api/owner/digiflazz/test
 * Test Digiflazz connection by checking balance.
 * Returns RAW response so owner can see if credentials are valid.
 */
export async function POST() {
  const cfg = await getDigiflazz();

  if (!cfg.username || !cfg.apiKey) {
    return NextResponse.json({
      ok: false,
      error: 'Konfigurasi Digiflazz belum ada. Simpan username & API key di Koneksi & API.',
    }, { status: 400 });
  }

  try {
    const sign = crypto
      .createHash('md5')
      .update(cfg.username + cfg.apiKey + 'deposit')
      .digest('hex');

    const json = await fetchJson('https://api.digiflazz.com/v1/cek-saldo', {
      cmd: 'deposit',
      username: cfg.username,
      sign,
    });

    // Check if Digiflazz returned an error
    if (json.data?.rc && json.data.rc !== '00') {
      return NextResponse.json({
        ok: false,
        error: json.data.message || 'Digiflazz menolak permintaan',
        raw: json,
      });
    }

    return NextResponse.json({
      ok: true,
      balance: json.data?.deposit ?? json.data?.saldo ?? 0,
      username: cfg.username,
      raw: json,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message || 'Gagal menghubungi API Digiflazz',
    }, { status: 500 });
  }
}
