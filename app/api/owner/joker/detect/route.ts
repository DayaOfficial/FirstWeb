import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getJoker } from '@/lib/server-config';
import { discoverJokerBase } from '@/lib/joker';

/**
 * POST /api/owner/joker/detect
 * Auto-detect JokerPanel endpoint by trying multiple candidate URLs.
 * Saves the working URL to Supabase settings.
 */
export async function POST() {
  const cfg = await getJoker();
  if (!cfg.key) {
    return NextResponse.json(
      { error: 'API key JokerPanel belum diisi. Simpan dulu di Koneksi & API.' },
      { status: 400 }
    );
  }

  const found = await discoverJokerBase(cfg.key, cfg.base);
  if (!found.ok) {
    return NextResponse.json(
      { error: found.error || 'Semua kandidat endpoint gagal.' },
      { status: 404 }
    );
  }

  // Save the working URL to Supabase settings
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await sb.from('settings').upsert(
    { key: 'jokerpanel_base_url', value: found.url, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  );

  return NextResponse.json({
    ok: true,
    url: found.url,
    balance: found.balance,
    currency: found.currency,
  });
}
