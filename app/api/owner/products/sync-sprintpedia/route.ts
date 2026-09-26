import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getSprint } from '@/lib/server-config';
import { sprintServices } from '@/lib/sprintpedia';

export const maxDuration = 60;

const PLATFORM_KEYWORDS = [
  'instagram', 'tiktok', 'youtube', 'facebook', 'twitter',
  'telegram', 'spotify', 'threads', 'shopee', 'snackvideo',
  'linkedin', 'twitch', 'discord', 'pinterest',
];

function platformOf(name: string, category: string): string {
  const lower = `${name} ${category}`.toLowerCase();
  const found = PLATFORM_KEYWORDS.find(k => lower.includes(k));
  return found ? found.charAt(0).toUpperCase() + found.slice(1) : 'Lainnya';
}

/**
 * Shared sync logic — dipanggil dari POST (manual) dan cron (otomatis).
 * Strategi: hapus semua produk jokerpanel lama, lalu upsert batch.
 */
export async function syncSprintPedia(sb: ReturnType<typeof createServiceClient>) {
  const cfg = await getSprint();
  if (!cfg.apiKey || !cfg.secretKey) {
    throw new Error('API Key / Secret Key SprintPedia belum diisi.');
  }

  const json = await sprintServices(cfg);
  const services = Array.isArray(json.data) ? json.data : [];
  if (services.length === 0) {
    throw new Error('SprintPedia tidak mengembalikan layanan.');
  }

  // === Step 1: Hapus semua produk jokerpanel lama ===
  await sb.from('products').delete().eq('module', 'jokerpanel');

  // === Step 2: Build rows ===
  const rows = services.map((s: any) => {
    const platform = platformOf(s.name ?? '', s.category ?? '');
    return {
      module: 'sprintpedia',
      provider_code: String(s.id),
      name: s.name,
      brand: platform,
      category: 'SMM',
      smm_category: s.category || null,
      service_type: s.type || null,
      description: s.description || null,
      min_qty: Number(s.min) || 10,
      max_qty: Number(s.max) || 100000,
      price_modal: Number(s.price),
      price_sell: Math.round(Number(s.price) * 1.3),
      is_cancelable: !!s.cancel,
      is_refillable: !!s.refill,
      refill_days: Number(s.refill_days || 0),
      avg_time: s.avg_time || null,
      is_active: true,
      synced_at: new Date().toISOString(),
    };
  });

  // === Step 3: Batch upsert (500 per batch) ===
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error, count } = await sb
      .from('products')
      .upsert(batch, {
        onConflict: 'provider_code',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`[sync-sprintpedia] batch ${i} error:`, error.message);
      errors++;
    } else {
      inserted += batch.length;
    }
  }

  // === Step 4: Count total ===
  const { count: total } = await sb
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('module', 'sprintpedia');

  return { synced: total ?? 0, inserted, errors, total: services.length };
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'owner') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const sb = createServiceClient();

  try {
    const result = await syncSprintPedia(sb);

    await sb.from('sync_logs').insert({
      provider: 'sprintpedia',
      action: 'services_sync',
      total_items: result.total,
      status: result.errors > 0 ? 'partial' : 'success',
      error_message: result.errors > 0 ? `${result.errors} batch gagal` : null,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    await sb.from('sync_logs').insert({
      provider: 'sprintpedia',
      action: 'services_sync',
      total_items: 0,
      status: 'error',
      error_message: message,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
