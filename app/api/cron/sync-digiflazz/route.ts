import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { fetchPriceList, type DigiflazzProduct } from '@/lib/providers/digiflazz';
import { getSettings } from '@/lib/server-config';

export const maxDuration = 60;

/**
 * GET /api/cron/sync-digiflazz
 *
 * Cron job: Auto-sinkronisasi produk Digiflazz setiap 6 jam.
 * Dilindungi oleh CRON_SECRET bearer token.
 * Schedule: every 6 hours (configured in vercel.json)
 */

const BRAND_TO_GAMEKEY: Record<string, string> = {
  'FREE FIRE': 'free_fire', 'MOBILE LEGENDS': 'mobile_legends',
  'PUBG MOBILE': 'pubg_mobile', 'GENSHIN IMPACT': 'genshin_impact',
  'HONKAI STAR RAIL': 'honkai_star_rail', 'VALORANT': 'valorant',
  'ROBLOX': 'roblox', 'HIGGS DOMINO': 'higgs_domino',
  'CALL OF DUTY MOBILE': 'codm', 'CALL OF DUTY': 'codm',
  'STEAM WALLET': 'steam_wallet', 'STEAM': 'steam_wallet',
};

const slug = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');

function mapCategory(cat: string): string {
  const c = (cat ?? '').toLowerCase();
  if (c.includes('games') || c.includes('voucher game')) return 'Game';
  if (c.includes('pulsa')) return 'Pulsa';
  if (c.includes('data')) return 'Data';
  if (c.includes('masa aktif')) return 'Pulsa';
  if (c.includes('paket sms') || c.includes('sms & telpon')) return 'Pulsa';
  if (c.includes('aktivasi perdana')) return 'Pulsa';
  if (c.includes('pln') || c.includes('token listrik')) return 'PLN';
  if (c.includes('e-money') || c.includes('e-wallet') || c.includes('emoney')) return 'E-Wallet';
  if (c.includes('tv') || c.includes('gas') || c.includes('pdam') || c.includes('bpjs') || c.includes('telkom') || c.includes('internet') || c.includes('pascabayar') || c.includes('pasca')) return 'Tagihan';
  if (c.includes('voucher') || c.includes('aktivasi voucher')) return 'Voucher';
  return cat;
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const sb = createServiceClient();

  try {
    const rawPrepaid = await fetchPriceList('prepaid');
    const prepaidItems = Array.isArray(rawPrepaid) ? rawPrepaid : [];

    let pascaItems: DigiflazzProduct[] = [];
    try {
      const rawPasca = await fetchPriceList('pasca');
      pascaItems = Array.isArray(rawPasca) ? rawPasca : [];
    } catch { /* skip */ }

    if (prepaidItems.length === 0 && pascaItems.length === 0) {
      return NextResponse.json({ error: '0 products from Digiflazz', synced: 0 });
    }

    // Read global markup
    const markupSettings = await getSettings(['digiflazz_markup_percent', 'digiflazz_markup_type']);
    const markupType = markupSettings.digiflazz_markup_type || 'percent';
    const markupValue = Number(markupSettings.digiflazz_markup_percent) || 15;

    function calcSellPrice(modal: number): number {
      if (markupType === 'nominal') return Math.round(modal + markupValue);
      return Math.round(modal * (1 + markupValue / 100));
    }

    const allRows: Record<string, unknown>[] = [];

    for (const item of prepaidItems) {
      if (!item.seller_product_status || !item.buyer_product_status) continue;
      const brandUpper = (item.brand ?? '').toUpperCase();
      const gameKey = BRAND_TO_GAMEKEY[brandUpper] ?? null;
      const category = gameKey ? 'Game' : mapCategory(item.category ?? '');
      const modal = Number(item.price) || 0;

      allRows.push({
        provider_code: item.buyer_sku_code,
        name: item.product_name,
        brand: item.brand || '',
        category,
        module: 'digiflazz',
        price_modal: modal,
        price_sell: calcSellPrice(modal),
        markup_type: markupType,
        markup_value: markupValue,
        is_active: true,
        ...(gameKey ? {
          game_name: item.brand,
          game_slug: slug(item.brand || ''),
        } : {}),
      });
    }

    for (const item of pascaItems) {
      if (!item.seller_product_status) continue;
      const category = mapCategory(item.category ?? '');
      const modal = Number(item.price) || 0;

      allRows.push({
        provider_code: item.buyer_sku_code,
        name: item.product_name,
        brand: item.brand || '',
        category,
        module: 'digiflazz',
        price_modal: modal,
        price_sell: calcSellPrice(modal),
        markup_type: markupType,
        markup_value: markupValue,
        is_active: true,
      });
    }

    // Upsert all
    const { error } = await sb.from('products').upsert(allRows, {
      onConflict: 'provider_code',
      ignoreDuplicates: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message, synced: 0 }, { status: 500 });
    }

    return NextResponse.json({
      synced: allRows.length,
      prepaid: prepaidItems.length,
      pasca: pascaItems.length,
      markup: `${markupType === 'percent' ? markupValue + '%' : 'Rp' + markupValue}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
