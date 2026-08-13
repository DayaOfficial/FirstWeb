import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { fetchPriceList } from '@/lib/providers/digiflazz';
import { NextResponse } from 'next/server';

// Mapping brand Digiflazz → game_key di game_input_templates
// Semua game yang dikenal dipetakan; brand tak dikenal tetap masuk dengan game_key = null
const BRAND_TO_GAMEKEY: Record<string, string> = {
  'FREE FIRE': 'free_fire',
  'MOBILE LEGENDS': 'mobile_legends',
  'PUBG MOBILE': 'pubg_mobile',
  'GENSHIN IMPACT': 'genshin_impact',
  'HONKAI STAR RAIL': 'honkai_star_rail',
  'VALORANT': 'valorant',
  'ROBLOX': 'roblox',
  'HIGGS DOMINO': 'higgs_domino',
  'CALL OF DUTY MOBILE': 'codm',
  'CALL OF DUTY': 'codm',
  'EFOOTBALL': 'efootball',
  'ARENA OF VALOR': 'arena_of_valor',
  'UNDAWN': 'undawn',
  'DREAM LEAGUE SOCCER': 'dream_league',
  'CLASH OF CLANS': 'clash_of_clans',
  'LOL WILD RIFT': 'wild_rift',
  'WILD RIFT': 'wild_rift',
  'LEAGUE OF LEGENDS': 'wild_rift',
  'STEAM WALLET': 'steam_wallet',
  'STEAM': 'steam_wallet',
};

function mapCategory(cat: string): string {
  const c = (cat ?? '').toLowerCase();
  if (c.includes('games') || c.includes('voucher game')) return 'Game';
  if (c.includes('pulsa')) return 'Pulsa';
  if (c.includes('data')) return 'Data';
  if (c.includes('pln') || c.includes('token')) return 'PLN';
  if (c.includes('e-money') || c.includes('e-wallet') || c.includes('emoney')) return 'E-Wallet';
  return cat;
}

export async function POST() {
  // Auth check: hanya owner
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'owner') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // Fetch dari Digiflazz
  const serviceSupabase = createServiceClient();

  try {
    const items = await fetchPriceList('prepaid');
    let inserted = 0;

    for (const item of items) {
      if (!item.buyer_product_status) continue; // skip produk tidak aktif

      const brandUpper = (item.brand ?? '').toUpperCase();
      const gameKey = BRAND_TO_GAMEKEY[brandUpper] ?? null;
      const category = mapCategory(item.category);

      await serviceSupabase.from('products').upsert({
        buyer_sku_code: item.buyer_sku_code,
        name: item.product_name,
        brand: item.brand,
        category,
        module: 'digiflazz',
        price_modal: item.price,
        price_sell: Math.round(item.price * 1.15), // default markup 15%
        game_name: category === 'Game' ? item.brand : null,
        is_active: false, // owner aktifkan manual
        stock: item.unlimited_stock ? -1 : item.stock,
        seller_product_status: item.seller_product_status,
        unlimited_stock: item.unlimited_stock,
        multi: item.multi,
        start_cut_off: item.start_cut_off || null,
        end_cut_off: item.end_cut_off || null,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'buyer_sku_code' });

      inserted++;
    }

    // Log sync
    await serviceSupabase.from('sync_logs').insert({
      provider: 'digiflazz',
      action: 'price_list_sync',
      total_items: inserted,
      status: 'success',
    });

    return NextResponse.json({ synced: inserted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    await serviceSupabase.from('sync_logs').insert({
      provider: 'digiflazz',
      action: 'price_list_sync',
      total_items: 0,
      status: 'error',
      error_message: message,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
