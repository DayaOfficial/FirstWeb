import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getJoker } from '@/lib/server-config';
import { jokerServices } from '@/lib/joker';

const PLATFORM_KEYWORDS = [
  'instagram', 'tiktok', 'youtube', 'facebook', 'twitter',
  'telegram', 'spotify', 'threads', 'shopee', 'snackvideo',
  'linkedin', 'twitch', 'discord', 'pinterest',
];

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

  const serviceSupabase = createServiceClient();

  try {
    const json = await jokerServices(cfg);
    const services = Array.isArray(json.services) ? json.services : (Array.isArray(json) ? json : []);

    if (services.length === 0) {
      return NextResponse.json({
        error: 'JokerPanel tidak mengembalikan layanan. Pastikan API ID & Key benar.',
        synced: 0,
      }, { status: 400 });
    }

    let saved = 0;

    for (const s of services) {
      const nameLower = (s.name ?? '').toLowerCase();
      const categoryLower = (s.category ?? '').toLowerCase();
      const platform = PLATFORM_KEYWORDS.find(k =>
        nameLower.includes(k) || categoryLower.includes(k)
      ) ?? 'Lainnya';

      const row = {
        module: 'jokerpanel',
        provider_code: String(s.id),
        name: s.name,
        brand: platform.charAt(0).toUpperCase() + platform.slice(1),
        category: 'SMM',
        service_type: s.type || null,
        description: s.description || null,
        min_qty: Number(s.min) || 10,
        max_qty: Number(s.max) || 100000,
        price_modal: Number(s.price),
        price_sell: Math.round(Number(s.price) * 1.3), // default 30% markup
        synced_at: new Date().toISOString(),
      };

      // Upsert: preserve owner's price_sell, is_active, image_url if already exists
      const { data: existing } = await serviceSupabase
        .from('products')
        .select('id, price_sell, is_active, image_url')
        .eq('provider_code', String(s.id))
        .eq('module', 'jokerpanel')
        .single();

      if (existing) {
        await serviceSupabase.from('products').update({
          ...row,
          price_sell: existing.price_sell, // keep owner's price
          is_active: existing.is_active,   // keep owner's toggle
          image_url: existing.image_url,   // keep owner's image
        }).eq('id', existing.id);
      } else {
        await serviceSupabase.from('products').insert({
          ...row,
          is_active: false, // owner aktifkan manual
        });
      }
      saved++;
    }

    await serviceSupabase.from('sync_logs').insert({
      provider: 'jokerpanel',
      action: 'services_sync',
      total_items: saved,
      status: 'success',
    });

    return NextResponse.json({ synced: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    await serviceSupabase.from('sync_logs').insert({
      provider: 'jokerpanel',
      action: 'services_sync',
      total_items: 0,
      status: 'error',
      error_message: message,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
