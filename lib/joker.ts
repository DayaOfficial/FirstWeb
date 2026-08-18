/**
 * JokerPanel helper — form-urlencoded requests + endpoint discovery.
 *
 * Many SMM panels read $_POST (form-urlencoded), NOT JSON.
 * This module sends form-urlencoded as the primary format.
 */

/**
 * POST with application/x-www-form-urlencoded.
 * Returns { status, json } — json is null if response isn't valid JSON.
 */
export async function postForm(
  url: string,
  body: Record<string, string>
): Promise<{ status: number; json: any | null }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
    });
    const text = await res.text();
    try {
      return { status: res.status, json: JSON.parse(text) };
    } catch {
      return { status: res.status, json: null };
    }
  } catch {
    return { status: 0, json: null };
  }
}

/**
 * Candidate URLs to try for JokerPanel API.
 * Different panels use different paths.
 */
const CANDIDATES = [
  'https://jokerpanel.com/api/v2',
  'https://jokerpanel.com/api/v2/',
  'https://jokerpanel.com/api/v1',
  'https://jokerpanel.com/api/',
  'https://jokerpanel.com/api/v2/index.php',
];

/**
 * Try all candidate URLs with a balance check.
 * Returns the first URL that responds with valid JSON containing balance info.
 */
export async function discoverJokerBase(
  key: string,
  customBase?: string
): Promise<{ ok: boolean; url?: string; balance?: number; currency?: string; error?: string }> {
  // If custom base is provided, try it first
  const urls = customBase
    ? [customBase, ...CANDIDATES.filter(c => c !== customBase)]
    : CANDIDATES;

  for (const url of urls) {
    const r = await postForm(url, { key, action: 'balance' });
    if (
      r.json &&
      (r.json.balance !== undefined || r.json.currency !== undefined)
    ) {
      return {
        ok: true,
        url,
        balance: Number(r.json.balance ?? 0),
        currency: r.json.currency ?? 'USD',
      };
    }
  }

  return {
    ok: false,
    error: 'Semua kandidat endpoint gagal. Pastikan domain & API key benar.',
  };
}
