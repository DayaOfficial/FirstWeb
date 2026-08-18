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
 * Get JokerPanel credentials (Official API format).
 * Source priority: Supabase settings → process.env
 * Auth: api_id (int) + api_key (string) — per jokerpanel.com/doc
 */
export async function getJoker() {
  const m = await getSettings(['jokerpanel_api_id', 'jokerpanel_api_key']);
  return {
    apiId: Number(m.jokerpanel_api_id || process.env.JOKERPANEL_API_ID || 0),
    apiKey: m.jokerpanel_api_key || process.env.JOKERPANEL_API_KEY || '',
  };
}

/**
 * Safe JSON fetch — prevents "Unexpected token '<'" errors.
 * If the response is not valid JSON (e.g. HTML 404), throws a descriptive error.
 */
export async function fetchJson(url: string, body: Record<string, unknown>) {
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
