import crypto from 'crypto';
import { getDigiflazz, getJoker, fetchJson } from '@/lib/server-config';

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
 * Cek saldo JokerPanel
 * Reads credentials from Supabase settings (fallback: process.env)
 */
export async function getJokerPanelBalance() {
  const cfg = await getJoker();

  if (!cfg.key) {
    return {
      provider: 'jokerpanel' as const,
      balance: 0,
      currency: 'USD',
      error: 'Konfigurasi JokerPanel belum ada. Simpan di halaman Koneksi & API.',
    };
  }

  try {
    const json = await fetchJson(cfg.base, {
      key: cfg.key,
      action: 'balance',
    });
    return {
      provider: 'jokerpanel' as const,
      balance: Number(json.balance ?? 0),
      currency: json.currency ?? 'USD',
      raw: json,
    };
  } catch (err: any) {
    return {
      provider: 'jokerpanel' as const,
      balance: 0,
      currency: 'USD',
      error: err.message || 'Gagal menghubungi API JokerPanel',
    };
  }
}
