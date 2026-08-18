import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServices } from '@/lib/providers/jokerpanel';
import { NextResponse } from 'next/server';

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

  const serviceSupabase = createServiceClient();

  try {
    const rawServices = await getServices();
    // Double guard: pastikan array, mencegah "e is not iterable"
    const services = Array.isArray(rawServices) ? rawServices : [];
    let inserted = 0;

    for (const s of services) {
      const nameLower = (s.name ?? '').toLowerCase();
      const platform = PLATFORM_KEYWORDS.find(k => nameLower.includes(k)) ?? 'Lainnya';

      await serviceSupabase.from('products').upsert({
        provider_service_id: String(s.service),
        name: s.name,
        category: 'SMM',
        module: 'jokerpanel',
        brand: platform.charAt(0).toUpperCase() + platform.slice(1), // capitalize
        price_modal: Number(s.rate),
        price_sell: Math.round(Number(s.rate) * 1.3), // markup 30% default
        description: `Min: ${s.min} | Max: ${s.max} | ${s.refill ? 'Refill ✓' : 'No refill'}`,
        is_active: false, // owner aktifkan manual
        synced_at: new Date().toISOString(),
      }, { onConflict: 'provider_service_id' });

      inserted++;
    }

    await serviceSupabase.from('sync_logs').insert({
      provider: 'jokerpanel',
      action: 'services_sync',
      total_items: inserted,
      status: 'success',
    });

    return NextResponse.json({ synced: inserted });
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
