import { createClient, createServiceClient } from '@/lib/supabase/server';
import { fetchPriceList, type DigiflazzProduct } from '@/lib/providers/digiflazz';
import { NextResponse } from 'next/server';

// Mapping brand Digiflazz → game_key di game_input_templates
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

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');

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
  if (profile?.role !== 'owner' && user.user_metadata?.role !== 'owner') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const serviceSupabase = createServiceClient();

  try {
    // === PREPAID ===
    const rawPrepaid = await fetchPriceList('prepaid');
    const prepaidItems = Array.isArray(rawPrepaid) ? rawPrepaid : [];

    // === PASCA (Tagihan: PLN postpaid, PDAM, BPJS, dll) ===
    let pascaItems: DigiflazzProduct[] = [];
    try {
      const rawPasca = await fetchPriceList('pasca');
      pascaItems = Array.isArray(rawPasca) ? rawPasca : [];
    } catch {
      // Pasca gagal tidak fatal — lanjutkan dengan prepaid saja
      console.warn('[sync-digiflazz] pasca fetch failed, skipping');
    }

    // Jika KEDUA-nya kosong, kemungkinan credential salah
    if (prepaidItems.length === 0 && pascaItems.length === 0) {
      await serviceSupabase.from('sync_logs').insert({
        provider: 'digiflazz',
        action: 'price_list_sync',
        total_items: 0,
        status: 'error',
        error_message: 'Digiflazz mengembalikan 0 produk (prepaid + pasca). Kemungkinan kredensial salah atau akun belum aktif.',
      });
      return NextResponse.json({
        error: 'Digiflazz tidak mengembalikan produk. Pastikan username & API key benar. Produk yang tersedia = yang aktif di akun Digiflazz Anda. Aktifkan lebih banyak di dashboard Digiflazz, lalu sinkron ulang.',
        synced: 0,
        prepaid: 0,
        pasca: 0,
      }, { status: 400 });
    }

    let saved = 0;
    let errors = 0;

    // Helper: upsert satu produk
    async function upsertProduct(row: Record<string, unknown>, providerCode: string, defaultMarkup: number) {
      const { data: existing } = await serviceSupabase
        .from('products')
        .select('id, price_sell, is_active, image_url, profit_type, profit_value')
        .eq('provider_code', providerCode)
        .single();

      if (existing) {
        const { error: upErr } = await serviceSupabase
          .from('products')
          .update({
            ...row,
            price_sell: existing.price_sell,
            is_active: existing.is_active,
            image_url: existing.image_url,
            profit_type: existing.profit_type,
            profit_value: existing.profit_value,
          })
          .eq('id', existing.id);
        if (upErr) { errors++; } else { saved++; }
      } else {
        const { error: insErr } = await serviceSupabase
          .from('products')
          .insert({ ...row, price_sell: defaultMarkup, is_active: false });
        if (insErr) { errors++; } else { saved++; }
      }
    }

    // --- Sync prepaid ---
    for (const item of prepaidItems) {
      if (!item.buyer_product_status) continue;

      const brandUpper = (item.brand ?? '').toUpperCase();
      const gameKey = BRAND_TO_GAMEKEY[brandUpper] ?? null;
      const category = mapCategory(item.category);
      const isGame = category === 'Game';

      await upsertProduct({
        module: 'digiflazz',
        provider_code: item.buyer_sku_code,
        name: item.product_name,
        brand: item.brand,
        category,
        price_modal: item.price,
        game_key: gameKey,
        game_slug: isGame ? slug(item.brand) : null,
        game_name: isGame ? item.brand : null,
        stock: item.unlimited_stock ? -1 : item.stock,
      }, item.buyer_sku_code, Math.round(item.price * 1.15));
    }

    // --- Sync pasca (tagihan) ---
    for (const item of pascaItems) {
      if (!item.buyer_product_status) continue;

      const category = mapCategory(item.category) || 'Tagihan';
      const adminFee = Number(item.price) || 0;

      await upsertProduct({
        module: 'digiflazz',
        provider_code: item.buyer_sku_code,
        name: item.product_name,
        brand: item.brand,
        category,
        price_modal: adminFee,
        stock: 9999,
      }, item.buyer_sku_code, adminFee + 2500);
    }

    // Log sync
    await serviceSupabase.from('sync_logs').insert({
      provider: 'digiflazz',
      action: 'price_list_sync',
      total_items: saved,
      status: errors > 0 ? 'partial' : 'success',
      error_message: errors > 0 ? `${errors} item gagal` : null,
    });

    return NextResponse.json({
      synced: saved,
      errors,
      prepaid: prepaidItems.length,
      pasca: pascaItems.length,
      hint: prepaidItems.length < 20
        ? 'Produk yang tersedia = yang aktif di akun Digiflazz Anda. Aktifkan lebih banyak di dashboard Digiflazz, lalu sinkron ulang.'
        : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[sync-digiflazz] fatal:', message);

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
