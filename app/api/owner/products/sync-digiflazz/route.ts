import { createClient, createServiceClient } from '@/lib/supabase/server';
import { fetchPriceList, type DigiflazzProduct } from '@/lib/providers/digiflazz';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

// Mapping brand Digiflazz ke game_key di game_input_templates
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

const slug = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');

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

  const sb = createServiceClient();

  try {
    // === Fetch prepaid + pasca dari API (2 calls) ===
    const rawPrepaid = await fetchPriceList('prepaid');
    const prepaidItems = Array.isArray(rawPrepaid) ? rawPrepaid : [];

    let pascaItems: DigiflazzProduct[] = [];
    try {
      const rawPasca = await fetchPriceList('pasca');
      pascaItems = Array.isArray(rawPasca) ? rawPasca : [];
    } catch {
      console.warn('[sync-digiflazz] pasca fetch failed, skipping');
    }

    if (prepaidItems.length === 0 && pascaItems.length === 0) {
      return NextResponse.json({
        error: 'Digiflazz mengembalikan 0 produk. Buka Diagnostik Raw untuk bukti. Aktifkan produk di dashboard Digiflazz.',
        synced: 0, prepaid: 0, pasca: 0,
      }, { status: 400 });
    }

    // === Build rows dari API response ===
    const allRows: Record<string, unknown>[] = [];

    for (const item of prepaidItems) {
      if (!item.buyer_product_status) continue;
      const brandUpper = (item.brand ?? '').toUpperCase();
      const gameKey = BRAND_TO_GAMEKEY[brandUpper] ?? null;
      const category = mapCategory(item.category);
      const isGame = category === 'Game';

      allRows.push({
        module: 'digiflazz',
        provider_code: item.buyer_sku_code,
        name: item.product_name,
        brand: item.brand,
        category,
        price_modal: item.price,
        price_sell: Math.round(item.price * 1.15),
        game_key: gameKey,
        game_slug: isGame ? slug(item.brand) : null,
        game_name: isGame ? item.brand : null,
        stock: item.unlimited_stock ? 9999 : (item.stock || 0),
        synced_at: new Date().toISOString(),
      });
    }

    for (const item of pascaItems) {
      if (!item.buyer_product_status) continue;
      const category = mapCategory(item.category) || 'Tagihan';
      const adminFee = Number(item.price) || 0;

      allRows.push({
        module: 'digiflazz',
        provider_code: item.buyer_sku_code,
        name: item.product_name,
        brand: item.brand,
        category,
        price_modal: adminFee,
        price_sell: adminFee + 2500,
        stock: 9999,
        synced_at: new Date().toISOString(),
      });
    }

    // === 1 query: ambil semua existing digiflazz products ===
    const { data: existing } = await sb
      .from('products')
      .select('id, provider_code, price_modal, price_sell, is_active, image_url, profit_type, profit_value')
      .eq('module', 'digiflazz');

    const existingMap = new Map(
      (existing || []).map((r: Record<string, unknown>) => [r.provider_code as string, r])
    );

    // === Split: insert baru vs update yang berubah ===
    const toInsert: Record<string, unknown>[] = [];
    const toUpdate: { id: string; updates: Record<string, unknown> }[] = [];

    for (const row of allRows) {
      const ex = existingMap.get(row.provider_code as string) as Record<string, unknown> | undefined;
      if (!ex) {
        // Produk baru: default is_active=false (owner aktifkan manual)
        toInsert.push({ ...row, is_active: false });
      } else {
        // Existing: hanya update jika price_modal berubah, PERTAHANKAN owner overrides
        if (Number(ex.price_modal) !== Number(row.price_modal)) {
          toUpdate.push({
            id: ex.id as string,
            updates: {
              name: row.name,
              brand: row.brand,
              category: row.category,
              price_modal: row.price_modal,
              stock: row.stock,
              game_key: row.game_key,
              game_slug: row.game_slug,
              game_name: row.game_name,
              synced_at: row.synced_at,
              // PRESERVE: price_sell, is_active, image_url, profit_type, profit_value
            },
          });
        }
      }
    }

    // === Batch insert (500 per batch) ===
    let insertErrors = 0;
    for (let i = 0; i < toInsert.length; i += 500) {
      const batch = toInsert.slice(i, i + 500);
      const { error } = await sb.from('products').insert(batch);
      if (error) {
        console.error('[sync-digiflazz] batch insert error:', error.message);
        insertErrors++;
      }
    }

    // === Parallel updates ===
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

    // === Log sync ===
    const totalErrors = insertErrors + updateErrors;
    await sb.from('sync_logs').insert({
      provider: 'digiflazz',
      action: 'price_list_sync',
      total_items: allRows.length,
      status: totalErrors > 0 ? 'partial' : 'success',
      error_message: totalErrors > 0 ? `${totalErrors} batch gagal` : null,
    });

    return NextResponse.json({
      synced: allRows.length,
      inserted: toInsert.length,
      updated: toUpdate.length,
      unchanged: allRows.length - toInsert.length - toUpdate.length,
      prepaid: prepaidItems.length,
      pasca: pascaItems.length,
      errors: totalErrors,
      hint: prepaidItems.length < 20
        ? 'Produk yang tersedia = yang aktif di akun Digiflazz Anda. Aktifkan lebih banyak di dashboard Digiflazz, lalu sinkron ulang.'
        : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[sync-digiflazz] fatal:', message);

    await sb.from('sync_logs').insert({
      provider: 'digiflazz',
      action: 'price_list_sync',
      total_items: 0,
      status: 'error',
      error_message: message,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
