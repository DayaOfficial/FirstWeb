import crypto from 'crypto';

/**
 * Cek saldo deposit Digiflazz
 * Endpoint: POST https://api.digiflazz.com/v1/cek-saldo
 * Sign: md5(username + apiKey + "deposit")
 */
export async function getDigiflazzBalance() {
  const username = process.env.DIGIFLAZZ_USERNAME;
  const apiKey = process.env.DIGIFLAZZ_API_KEY;

  if (!username || !apiKey) {
    return {
      provider: 'digiflazz' as const,
      balance: 0,
      currency: 'IDR',
      error: 'DIGIFLAZZ_USERNAME atau DIGIFLAZZ_API_KEY belum dikonfigurasi',
    };
  }

  const sign = crypto
    .createHash('md5')
    .update(username + apiKey + 'deposit')
    .digest('hex');

  try {
    const res = await fetch('https://api.digiflazz.com/v1/cek-saldo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd: 'deposit', username, sign }),
    });
    const json = await res.json();
    return {
      provider: 'digiflazz' as const,
      balance: Number(json.data?.deposit ?? 0),
      currency: 'IDR',
      raw: json,
    };
  } catch (err) {
    return {
      provider: 'digiflazz' as const,
      balance: 0,
      currency: 'IDR',
      error: 'Gagal menghubungi API Digiflazz',
    };
  }
}

/**
 * Cek saldo JokerPanel
 * Endpoint: POST ke JOKERPANEL_BASE_URL
 * Body: { key, action: "balance" }
 */
export async function getJokerPanelBalance() {
  const apiKey = process.env.JOKERPANEL_API_KEY;
  const baseUrl = process.env.JOKERPANEL_BASE_URL;

  if (!apiKey || !baseUrl) {
    return {
      provider: 'jokerpanel' as const,
      balance: 0,
      currency: 'USD',
      error: 'JOKERPANEL_API_KEY atau JOKERPANEL_BASE_URL belum dikonfigurasi',
    };
  }

  try {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: apiKey, action: 'balance' }),
    });
    const json = await res.json();
    return {
      provider: 'jokerpanel' as const,
      balance: Number(json.balance ?? 0),
      currency: json.currency ?? 'USD',
      raw: json,
    };
  } catch (err) {
    return {
      provider: 'jokerpanel' as const,
      balance: 0,
      currency: 'USD',
      error: 'Gagal menghubungi API JokerPanel',
    };
  }
}
