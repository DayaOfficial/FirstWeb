import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import GameTopUpFlow from '@/components/store/game-topup-flow';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

// Fallback input schemas per game (used when game_input_templates not populated)
const FALLBACK_INPUT_SCHEMAS: Record<string, any> = {
  'mobile_legends': {
    fields: [
      { key: 'user_id', label: 'User ID', type: 'number', required: true, placeholder: 'Contoh: 123456789', helper: 'Ketuk profil, salin ID' },
      { key: 'zone_id', label: 'Zone ID', type: 'number', required: true, placeholder: 'Contoh: 1234', helper: 'Angka dalam kurung setelah ID' },
    ],
    format_customer_no: '{user_id}.{zone_id}',
  },
  'free_fire': {
    fields: [{ key: 'player_id', label: 'Player ID', type: 'number', required: true, placeholder: 'Contoh: 123456789', helper: 'Lihat di profil, di bawah nickname' }],
    format_customer_no: '{player_id}',
  },
  'genshin_impact': {
    fields: [{ key: 'uid', label: 'UID', type: 'number', required: true, placeholder: 'Contoh: 812345678', helper: 'Server Asia diawali angka 8 (9 digit)' }],
    format_customer_no: '{uid}',
  },
  'pubg_mobile': {
    fields: [{ key: 'player_id', label: 'Character ID', type: 'number', required: true, placeholder: 'Contoh: 5123456789', helper: 'Profil → Character ID (9-10 digit)' }],
    format_customer_no: '{player_id}',
  },
  'valorant': {
    fields: [
      { key: 'riot_id', label: 'Riot ID', type: 'text', required: true, placeholder: 'Contoh: BUDIGAMING' },
      { key: 'riot_tag', label: 'Tagline', type: 'text', required: true, placeholder: 'Contoh: 1234', helper: 'Kode setelah tanda #' },
    ],
    format_customer_no: '{riot_id}#{riot_tag}',
  },
  'roblox': {
    fields: [{ key: 'username', label: 'Username Roblox', type: 'text', required: true, placeholder: 'Contoh: budi_gaming123', helper: 'Username login, bukan display name' }],
    format_customer_no: '{username}',
  },
  'honkai_star_rail': {
    fields: [{ key: 'uid', label: 'UID', type: 'number', required: true, placeholder: 'Contoh: 812345678', helper: '9 digit, diawali angka 8' }],
    format_customer_no: '{uid}',
  },
  'higgs_domino': {
    fields: [{ key: 'player_id', label: 'Player ID', type: 'number', required: true, placeholder: 'Contoh: 123456789' }],
    format_customer_no: '{player_id}',
  },
  'codm': {
    fields: [{ key: 'player_id', label: 'Player ID / UID', type: 'number', required: true, placeholder: 'Contoh: 6812345678' }],
    format_customer_no: '{player_id}',
  },
  'clash_of_clans': {
    fields: [{ key: 'player_tag', label: 'Player Tag', type: 'text', required: true, placeholder: 'Contoh: #P0JCQL9', helper: 'Tag diawali # (dari profil)' }],
    format_customer_no: '{player_tag}',
  },
  'steam_wallet': {
    fields: [{ key: 'email', label: 'Email Steam', type: 'email', required: true, placeholder: 'email@contoh.com', helper: 'Email yang terdaftar di akun Steam' }],
    format_customer_no: '{email}',
  },
};

// Fallback currency labels
const CURRENCY_MAP: Record<string, string> = {
  'mobile_legends': 'Diamonds',
  'free_fire': 'Diamonds',
  'genshin_impact': 'Genesis Crystals',
  'valorant': 'Valorant Points',
  'pubg_mobile': 'UC',
  'roblox': 'Robux',
  'honkai_star_rail': 'Oneiric Shards',
  'codm': 'CP',
  'clash_of_clans': 'Gems',
  'steam_wallet': 'Saldo',
  'higgs_domino': 'Chip',
};

export async function generateMetadata({ params }: { params: Promise<{ gameSlug: string }> }) {
  const { gameSlug } = await params;
  const supabase = await createClient();

  // Try to find game name from DB
  const { data } = await supabase
    .from('products')
    .select('game_name')
    .eq('game_slug', gameSlug)
    .eq('is_active', true)
    .limit(1)
    .single();

  return {
    title: data?.game_name ? `Top Up ${data.game_name}` : 'Top Up Game',
  };
}

export default async function GameDetailPage({ params }: { params: Promise<{ gameSlug: string }> }) {
  const { gameSlug } = await params;
  const supabase = await createClient();

  // Ambil semua produk aktif untuk game ini (by game_slug)
  const { data: dbProducts } = await supabase
    .from('products')
    .select('id, name, price_sell, provider_code, image_url, game_name, game_key, currency_label, game_slug')
    .eq('game_slug', gameSlug)
    .eq('is_active', true)
    .order('price_sell', { ascending: true });

  const products = dbProducts ?? [];

  // Game tidak ditemukan
  if (products.length === 0) {
    notFound();
  }

  // Ambil info game dari produk pertama
  const firstProduct = products[0];
  const gameName = firstProduct.game_name || gameSlug;
  const gameKey = firstProduct.game_key || gameSlug;
  const imageUrl = firstProduct.image_url || null;
  const currency = firstProduct.currency_label || CURRENCY_MAP[gameKey] || 'Item';

  // Ambil template input dari game_input_templates
  const { data: template } = await supabase
    .from('game_input_templates')
    .select('input_schema')
    .eq('game_key', gameKey)
    .single();

  const inputSchema = (template?.input_schema as any)
    || FALLBACK_INPUT_SCHEMAS[gameKey]
    || {
      fields: [{ key: 'player_id', label: 'ID Pemain', type: 'text', required: true, placeholder: 'Masukkan ID' }],
      format_customer_no: '{player_id}',
    };

  // Map DB products ke nominals format
  const nominals = products.map(n => ({
    id: n.id,
    name: n.name,
    price_sell: Number(n.price_sell),
    buyer_sku_code: n.provider_code || '',
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <Link href="/topup-game" className="hover:text-primary transition-colors">Top Up Game</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">{gameName}</span>
      </nav>

      <GameTopUpFlow
        game={{
          name: gameName,
          slug: gameSlug,
          image: imageUrl || '',
          currency,
        }}
        nominals={nominals}
        inputSchema={inputSchema}
      />
    </div>
  );
}
