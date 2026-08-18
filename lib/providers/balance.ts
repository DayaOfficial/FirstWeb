import crypto from 'crypto';
import { getDigiflazz, getJoker, fetchJson } from '@/lib/server-config';
import { jokerBalance } from '@/lib/joker';

/**
 * Cek saldo deposit Digiflazz
 * Reads credentials from Supabase settings (fallback: process.env)
 */
export async function getDigiflazzBalance() {
  const cfg = await getDigiflazz();

  if (!cfg.username || !cfg.apiKey) {
    return {
      provider: 'digiflazz' as const,
      balance: 0,
      currency: 'IDR',
      error: 'Konfigurasi Digiflazz belum ada. Simpan di halaman Koneksi & API.',
    };
  }

  const sign = crypto
    .createHash('md5')
    .update(cfg.username + cfg.apiKey + 'deposit')
    .digest('hex');

  try {
    const json = await fetchJson('https://api.digiflazz.com/v1/cek-saldo', {
      cmd: 'deposit',
      username: cfg.username,
      sign,
    });
    return {
      provider: 'digiflazz' as const,
      balance: Number(json.data?.deposit ?? json.data?.saldo ?? 0),
      currency: 'IDR',
      raw: json,
    };
  } catch (err: any) {
    return {
      provider: 'digiflazz' as const,
      balance: 0,
      currency: 'IDR',
      error: err.message || 'Gagal menghubungi API Digiflazz',
    };
  }
}

/**
 * Cek saldo JokerPanel (Official API)
 * Uses POST /api/balance with api_id + api_key
 * Reads credentials from Supabase settings (fallback: process.env)
 */
export async function getJokerPanelBalance() {
  const cfg = await getJoker();

  if (!cfg.apiId || !cfg.apiKey) {
    return {
      provider: 'jokerpanel' as const,
      balance: 0,
      currency: 'IDR',
      error: 'API ID / API Key JokerPanel belum diisi. Simpan di halaman Koneksi & API.',
    };
  }

  try {
    const json = await jokerBalance(cfg);
    return {
      provider: 'jokerpanel' as const,
      balance: Number(json.balance ?? 0),
      currency: json.currency ?? 'IDR',
      raw: json,
    };
  } catch (err: any) {
    return {
      provider: 'jokerpanel' as const,
      balance: 0,
      currency: 'IDR',
      error: err.message || 'Gagal menghubungi API JokerPanel',
    };
  }
}
