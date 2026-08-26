import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getJoker } from '@/lib/server-config';
import { jokerServices } from '@/lib/joker';

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

export async function POST() {
  // Auth check: hanya owner
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'owner') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const cfg = await getJoker();
  if (!cfg.apiId || !cfg.apiKey) {
    return NextResponse.json({
      error: 'API ID / API Key JokerPanel belum diisi di halaman Koneksi & API.',
    }, { status: 400 });
  }

  const sb = createServiceClient();

  try {
    // === 1 API call: ambil semua services ===
    const json = await jokerServices(cfg);
    const services = Array.isArray(json.services) ? json.services : (Array.isArray(json) ? json : []);

    if (services.length === 0) {
      return NextResponse.json({
        error: 'JokerPanel tidak mengembalikan layanan. Pastikan API ID & Key benar.',
        synced: 0,
      }, { status: 400 });
    }

    // === Build rows dari API response ===
    const allRows: Record<string, unknown>[] = [];
    for (const s of services) {
      const platform = platformOf(s.name ?? '', s.category ?? '');
      allRows.push({
        module: 'jokerpanel',
        provider_code: String(s.id),
        name: s.name,
        brand: platform,
        category: 'SMM',
        smm_category: s.category || null,  // Kategori asli dari JokerPanel
        service_type: s.type || null,
        description: s.description || null,
        min_qty: Number(s.min) || 10,
        max_qty: Number(s.max) || 100000,
        price_modal: Number(s.price),
        price_sell: Math.round(Number(s.price) * 1.3),
        synced_at: new Date().toISOString(),
      });
    }

    // === 1 query: ambil semua existing jokerpanel products ===
    const { data: existing } = await sb
      .from('products')
      .select('id, provider_code, price_modal')
      .eq('module', 'jokerpanel');

    const existingMap = new Map(
      (existing || []).map((r: Record<string, unknown>) => [r.provider_code as string, r])
    );

    // === Split: insert vs update ===
    const toInsert: Record<string, unknown>[] = [];
    const toUpdate: { id: string; updates: Record<string, unknown> }[] = [];

    for (const row of allRows) {
      const ex = existingMap.get(row.provider_code as string) as Record<string, unknown> | undefined;
      if (!ex) {
        toInsert.push({ ...row, is_active: false });
      } else if (Number(ex.price_modal) !== Number(row.price_modal)) {
        toUpdate.push({
          id: ex.id as string,
          updates: {
            name: row.name,
            brand: row.brand,
            smm_category: row.smm_category,
            service_type: row.service_type,
            description: row.description,
            min_qty: row.min_qty,
            max_qty: row.max_qty,
            price_modal: row.price_modal,
            synced_at: row.synced_at,
            // PRESERVE: price_sell, is_active, image_url
          },
        });
      }
    }

    // === Batch insert (500 per batch) — STOP pada error pertama ===
    for (let i = 0; i < toInsert.length; i += 500) {
      const batch = toInsert.slice(i, i + 500);
      const { error } = await sb.from('products').insert(batch);
      if (error) {
        console.error('[sync-jokerpanel] batch insert error:', error.message);
        return NextResponse.json({
          error: 'Insert gagal: ' + error.message,
          batch: `${i}-${i + batch.length}`,
        }, { status: 500 });
      }
    }

    // === Parallel updates (batches of 50) ===
    let updateErrors = 0;
    const updateBatches = [];
    for (let i = 0; i < toUpdate.length; i += 50) {
      const batch = toUpdate.slice(i, i + 50);
      updateBatches.push(
        Promise.all(
          batch.map(u =>
            sb.from('products').update(u.updates).eq('id', u.id)
              .then(({ error }: { error: unknown }) => { if (error) updateErrors++; })
          )
        )
      );
    }
    await Promise.all(updateBatches);

    // === Hitung dari DB setelah insert (count nyata) ===
    const { count } = await sb
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('module', 'jokerpanel');

    // === Log ===
    await sb.from('sync_logs').insert({
      provider: 'jokerpanel',
      action: 'services_sync',
      total_items: allRows.length,
      status: updateErrors > 0 ? 'partial' : 'success',
      error_message: updateErrors > 0 ? `${updateErrors} update gagal` : null,
    });

    return NextResponse.json({
      synced: count ?? 0,
      inserted: toInsert.length,
      updated: toUpdate.length,
      unchanged: allRows.length - toInsert.length - toUpdate.length,
      errors: updateErrors,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    await sb.from('sync_logs').insert({
      provider: 'jokerpanel',
      action: 'services_sync',
      total_items: 0,
      status: 'error',
      error_message: message,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
