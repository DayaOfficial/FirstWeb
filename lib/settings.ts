/**
 * Settings helper — read/write from Supabase `settings` table.
 * Used by API config page and any component that needs persistent config.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export async function loadSettings(sb: SupabaseClient, keys: string[]): Promise<Record<string, string>> {
  const { data } = await sb.from('settings').select('key, value').in('key', keys);
  const m: Record<string, string> = {};
  for (const r of (data || []) as { key: string; value: string | null }[]) {
    m[r.key] = r.value || '';
  }
  return m;
}

export async function saveSettings(
  sb: SupabaseClient,
  entries: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const rows = Object.entries(entries).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await sb.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) {
    console.error('[saveSettings]', error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}
