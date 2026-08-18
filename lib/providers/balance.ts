import crypto from 'crypto';
import { getDigiflazz, getJoker, fetchJson } from '@/lib/server-config';
import { postForm } from '@/lib/joker';

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
 * Uses form-urlencoded (not JSON) because SMM panels expect $_POST.
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
    const r = await postForm(cfg.base, { key: cfg.key, action: 'balance' });
    if (r.json === null) {
      return {
        provider: 'jokerpanel' as const,
        balance: 0,
        currency: 'USD',
        error: `Respons bukan JSON dari ${cfg.base} (status ${r.status}). Jalankan "Deteksi Endpoint" di Koneksi API.`,
      };
    }
    return {
      provider: 'jokerpanel' as const,
      balance: Number(r.json.balance ?? 0),
      currency: r.json.currency ?? 'USD',
      raw: r.json,
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
