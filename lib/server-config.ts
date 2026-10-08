/**
 * Server Config — single source of truth for API credentials.
 *
 * Priority: Supabase `settings` table → process.env (fallback).
 *
 * ALL server routes (balance, sync, topup, smm) MUST use this helper.
 * NEVER read process.env directly for username/API key/base URL.
 */

import { createClient } from '@supabase/supabase-js';

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Read multiple keys from the `settings` table.
 */
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const { data } = await admin()
    .from('settings')
    .select('key, value')
    .in('key', keys);

  const m: Record<string, string> = {};
  for (const r of (data || []) as { key: string; value: string | null }[]) {
    if (r.value) m[r.key] = r.value;
  }
  return m;
}

/**
 * Get Digiflazz credentials.
 * Source priority: Supabase settings → process.env
 */
export async function getDigiflazz() {
  const m = await getSettings(['digiflazz_username', 'digiflazz_api_key']);
  return {
    username: m.digiflazz_username || process.env.DIGIFLAZZ_USERNAME || '',
    apiKey: m.digiflazz_api_key || process.env.DIGIFLAZZ_API_KEY || '',
  };
}

/**
 * Get SprintPedia credentials.
 * Source priority: Supabase settings → process.env
 * Auth: api_key + secret_key — no IP whitelist needed.
 */
export async function getSprint() {
  const m = await getSettings(['sprintpedia_api_key', 'sprintpedia_secret_key']);
  return {
    apiKey: m.sprintpedia_api_key || process.env.SPRINTPEDIA_API_KEY || '',
    secretKey: m.sprintpedia_secret_key || process.env.SPRINTPEDIA_SECRET_KEY || '',
  };
}

/**
 * Get Pakasir (QRIS) credentials.
 * Source priority: Supabase settings → process.env
 */
export async function getPakasir() {
  const m = await getSettings(['pakasir_merchant_code', 'pakasir_api_key']);
  return {
    slug: m.pakasir_merchant_code || process.env.PAKASIR_SLUG || '',
    apiKey: m.pakasir_api_key || process.env.PAKASIR_API_KEY || '',
  };
}

/**
 * Safe JSON fetch — prevents "Unexpected token '<'" errors.
 * If DIGIFLAZZ_PROXY_URL is set AND the target is api.digiflazz.com,
 * routes through the proxy for fixed-IP whitelist compliance.
 */
export async function fetchJson(url: string, body: Record<string, unknown>) {
  const proxyUrl = process.env.DIGIFLAZZ_PROXY_URL;
  const proxySecret = process.env.DIGIFLAZZ_PROXY_SECRET || '';

  // Route through proxy if configured and target is Digiflazz
  if (proxyUrl && url.startsWith('https://api.digiflazz.com/')) {
    const proxyHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (proxySecret) {
      proxyHeaders['Authorization'] = `Bearer ${proxySecret}`;
    }

    const res = await fetch(`${proxyUrl}/proxy`, {
      method: 'POST',
      headers: proxyHeaders,
      body: JSON.stringify({ url, data: body }),
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        `Proxy response bukan JSON (status ${res.status}). Awalan: ${text.substring(0, 120)}`
      );
    }
  }

  // Direct call (non-Digiflazz or no proxy)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Respons bukan JSON (status ${res.status}). Kemungkinan URL/API key salah. Awalan respons: ${text.substring(0, 120)}`
    );
  }
}
