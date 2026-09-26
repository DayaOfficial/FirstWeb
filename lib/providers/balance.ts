import crypto from 'crypto';
import { getDigiflazz, getSprint, fetchJson } from '@/lib/server-config';
import { sprintServices } from '@/lib/sprintpedia';

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
 * Cek koneksi SprintPedia
 * SprintPedia tidak punya endpoint /balance, jadi kita test via /services.
 * Jika berhasil = terhubung, kita hitung jumlah layanan sebagai indikator.
 */
export async function getSprintPediaBalance() {
  const cfg = await getSprint();

  if (!cfg.apiKey || !cfg.secretKey) {
    return {
      provider: 'sprintpedia' as const,
      balance: 0,
      currency: 'IDR',
      error: 'API Key / Secret Key SprintPedia belum diisi. Simpan di halaman Koneksi & API.',
    };
  }

  try {
    const json = await sprintServices(cfg);
    const count = Array.isArray(json.data) ? json.data.length : 0;
    return {
      provider: 'sprintpedia' as const,
      balance: count, // Jumlah layanan tersedia
      currency: 'IDR',
      raw: json,
    };
  } catch (err: any) {
    return {
      provider: 'sprintpedia' as const,
      balance: 0,
      currency: 'IDR',
      error: err.message || 'Gagal menghubungi API SprintPedia',
    };
  }
}
