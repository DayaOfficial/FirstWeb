import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import GameTopUpFlow from '@/components/store/game-topup-flow';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

// Mapping hardcoded games ke game_key di game_input_templates
const GAME_KEY_MAP: Record<string, string> = {
  'ml': 'mobile_legends',
  'ff': 'free_fire',
  'gi': 'genshin_impact',
  'vl': 'valorant',
  'pb': 'pubg_mobile',
  'rb': 'roblox',
  'hsr': 'honkai_star_rail',
  'cod': 'call_of_duty',
  'coc': 'clash_of_clans',
  'stm': 'steam_wallet',
  'hd': 'higgs_domino',
};

// Fallback game info jika belum ada di DB
const GAME_INFO: Record<string, { name: string; currency: string; image: string }> = {
  'ml': { name: 'Mobile Legends', currency: 'Diamonds', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrO3ian6CZZIsP4gYGo_L6vmcM8wOJdNB138X06adCpXnyNfxLfSEqgHaUFpnI2u5yd5CUjvQ-KIIQJ1ATMa3xVn0YJGwVLTWxI9qOtFwgDPRvUM0KXdcTHjKcSBfJeRIWr939tyhNsz86kqGzsWaFfBNFuGg9ZWl_LUeWV1mDmCYdYB9pN81lieK8pD5dahzIs8sb6YZ6fZ0keMfiu0t334ZC9sgdTBEXwrJ_9MwHGY4apPYV_RdXLaML-2z-X6Zvm6Bq0fBRO6U' },
  'ff': { name: 'Free Fire', currency: 'Diamonds', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpCn0_4AfepUVpRZZQ3cceYDWU5b_e4sTIbsxrlpwKS7xJWu6nRIUoHC_cl3dnYbfacK8pUOFinM7bTGEYb0mZauDXxWdnB_kOXBdbRt9xT1M69JYh_4Lr-9GTgyANRwEhkEGIzJ0CN2zdx2QLRx7XcqjYXDcevEw_2lCtMg4rfj4y7ZDqtSJeLGlhstiGvFyyEHSUYONAJZad6iTpSimYl-QZw8yHPWStIwQomIPaXRG68ANyrYoHn3AOTVJA02t2JV2uWLu9AoU' },
  'gi': { name: 'Genshin Impact', currency: 'Genesis Crystals', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9EhvRVBa3n_zwyvDw-NMToelNuN1_MHct2WnZw-ZkLtr5l6pUlmZSLibEEerKxi2gMUYCh6uebfAKA--kS7RzhAdS2XCiL6sfOUjmQWMF2stm5Lw0XXQ2C5qFXhtQbj0VsKbbmZpi0gpGpuD47fX8VsVD2d_wJDsdDCc96QkRToPWJYhji05cN1DWoZrmu5YOZCWGppkH08spr2ALt6oqf2wQ1A9lNP0qJ6B6yED_y8tWYXspM6SZC6qEFLsO7Nm2UJIx8fqNSII' },
  'vl': { name: 'Valorant', currency: 'Valorant Points', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBT7t8Fn5Vx1b2sRIgKpPk6E45xUtSkIJvq8a1wlgw98_9jpaYlZHkRxANh7iLowmH7tJHCKpUZ_W8cONoviA18MZxjw_DTq_2pLuWmTyr1pjffsfJwYP9cVG79lQjfeuv8KHZerC4KlX0_UekLHuTKDbrlCiU8m9eUIreo6apZiT_mswTiE3Dt3twOLMszCcE0XWk1vMQTDjIWczLQNsl4sgld6reN57-dhPW6CidNUQTy7JVvRKkdg3tELrcTzHv50rwiUnz5Wl0' },
  'pb': { name: 'PUBG Mobile', currency: 'UC', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4mrQ92IrgyIV0qDxE8dmrJ-u2qtdzxIRgVXBN__lDLi1OdVdUSTd4kN7DlBSCO2Qr0HuJrtQGQHINgMSu4V_v0qoEEF7kEE0bBA23V46v0I39_aN8a5NCxJQY0LuO4wNtuoU63woxyVy99qYaZmB4Q-I3eSq_1NutJQeq8Nd15P21cbAy7DH2eWw3LKzCXQzSEci6faHNkiH57oMuKSe6xXVPl_WURUeIWh_bP3zfkfAUKkUo1dIBG7hbtoRkg-ZUpZljkim--H8' },
  'rb': { name: 'Roblox', currency: 'Robux', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6KtOgwnT3jLWET7MrNt4Gudt7LGmSl9heb3VVhVvPN47ajRzqsVjV1WiTKBeKMvMYtV0Ty0btFJXDxc2R0V69AJXInJf80lnwKAca7-OaXrGJXGPnCzpTLPiM6RcMmIxVwY8YbgVqEDc1a3ABGmIT_10SMlsQ_wftxi0DuB-4FEX64AR9V2nLKS8RUaWpwlUgLYNzwx9WuGExTkO8frqcYlk08KcpGB2hAvOk6frZu4J7FBIMT2t3UwJlsWZsYr5CvqysVZSOYZQ' },
  'hsr': { name: 'Honkai Star Rail', currency: 'Oneiric Shards', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8T-pH1ZQvfvG3gsvT_eTraHDaQAFYuj_ILG0wHmKAuEp39mGqMBZv6u1Y0Mf06xSCm2Ipl3x5yvLogVzZ-_PdziTuhK9case1yZVi6Svba6MkMjIupENquLiEY_n0kQLyjvmgj-N_4gnPCFLPR5ExW09WQfjEwIv52IBdQxLj4ni07T2BX4jVuqFDv9y9baWgphdgKIwQf0swgTY8ItnvW93Vrdu63PKnSU2Rk0rwGgBLCKn9INFymvBnJ2DzNAaX3YEmg9UwM2A' },
  'cod': { name: 'Call of Duty Mobile', currency: 'CP', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdDmjzILbTafst_2sDZSYUsyrLaWxeJ3q6QBybIS7dZiFkJZca25ZLkox1ZHYDTcLsLxHCJzMZVux-Lk57sZI8YKTiI3dHzhQqjVOU1G4StgrFiZuPdYupc69QSoftacoUK2FjXmFHM1_8N70o3F4c4NU4fczvB4tROAW23BXowR_B9QhWG9R2vwcQ7Bse1a5Rpl7EqxfUf97Oa2nJLW4pMPyLdZDaXc2WUa3vL0ydBpM9XPnhWQUovM_YBatmXN3MAIXHWb0qMHU' },
  'coc': { name: 'Clash of Clans', currency: 'Gems', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFxFcMH15Rf-m9nTqv4xOuwnzXi8l1k-vhI0oTbCo20DD7A8X2Ehv1a0c32UrKgnz8hvSuwFk_TO17Ry7wzAYEPERhHqAu7I14AcCe26MuWjuc1_ULFjtVrCdSmKzZMK2CfRw2TRKp_dPATL9ULUscrrAUbxkuisjAZ6pGRe-QEEJ81OAijVHyZhYtOPIsgOYgaxd9So8u4YzBT7mFuvBwIdaJWyt64AE0fF610O1txjBjI_97l9E5MBTrJP1M4DyMMHyxeI-GcW0' },
  'stm': { name: 'Steam Wallet', currency: 'Saldo', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGiQFpYfkW14sYQMtAcIlcfJLR_4Shyz8VVE_SzazSKPLVdTrmIfCTFOYj1ZaQrOiQ9FTIVGalX_2gsW7RCYh7txdvcR9qXXTvXlHAoVdAD8xIXVItKb0GCMU4q-KagplbxDIwneFzcA7eo2UZfjUA3qbrxvtZnjDB9jAAQDPisXvy_Xwmh79hMd4_SuG1PS6KV3m-oSmi_9Z8MZRwtXTNSMZ7uW3zbmAMykSs6d_EKK3Sp5sdLFTldAE0sYDE8JgdFMmzMyb8xQw' },
  'hd': { name: 'Higgs Domino Island', currency: 'Chip', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9EhvRVBa3n_zwyvDw-NMToelNuN1_MHct2WnZw-ZkLtr5l6pUlmZSLibEEerKxi2gMUYCh6uebfAKA--kS7RzhAdS2XCiL6sfOUjmQWMF2stm5Lw0XXQ2C5qFXhtQbj0VsKbbmZpi0gpGpuD47fX8VsVD2d_wJDsdDCc96QkRToPWJYhji05cN1DWoZrmu5YOZCWGppkH08spr2ALt6oqf2wQ1A9lNP0qJ6B6yED_y8tWYXspM6SZC6qEFLsO7Nm2UJIx8fqNSII' },
};

// Fallback nominals jika belum sync dari Digiflazz
function getFallbackNominals(gameSlug: string) {
  const currency = GAME_INFO[gameSlug]?.currency || 'Item';
  const baseNominals = [
    { amount: 50, price: 15000 },
    { amount: 100, price: 28000 },
    { amount: 250, price: 65000 },
    { amount: 500, price: 125000 },
    { amount: 1000, price: 245000 },
    { amount: 2500, price: 590000 },
  ];
  return baseNominals.map((n, i) => ({
    id: `fallback-${gameSlug}-${i}`,
    name: `${n.amount} ${currency}`,
    price_sell: n.price,
    buyer_sku_code: `${gameSlug}-${n.amount}`,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ gameSlug: string }> }) {
  const { gameSlug } = await params;
  const info = GAME_INFO[gameSlug];
  return {
    title: info ? `Top Up ${info.name}` : 'Top Up Game',
  };
}

export default async function GameDetailPage({ params }: { params: Promise<{ gameSlug: string }> }) {
  const { gameSlug } = await params;
  const supabase = await createClient();

  const gameKey = GAME_KEY_MAP[gameSlug] || gameSlug;

  // Coba ambil nominals dari DB (hasil sync Digiflazz)
  const { data: dbNominals } = await supabase
    .from('products')
    .select('id, name, price_sell, buyer_sku_code, image_url, game_name, currency_label')
    .eq('game_name', GAME_INFO[gameSlug]?.name || gameSlug)
    .eq('is_active', true)
    .order('price_sell', { ascending: true });

  // Ambil template input dari game_input_templates
  const { data: template } = await supabase
    .from('game_input_templates')
    .select('input_schema')
    .eq('game_key', gameKey)
    .single();

  // Fallback input schema per game jika belum ada di DB
  const FALLBACK_INPUT_SCHEMAS: Record<string, any> = {
    'ml': {
      fields: [
        { key: 'user_id', label: 'User ID', type: 'number', required: true, placeholder: 'Contoh: 123456789', helper: 'Ketuk profil, salin ID' },
        { key: 'zone_id', label: 'Zone ID', type: 'number', required: true, placeholder: 'Contoh: 1234', helper: 'Angka dalam kurung setelah ID' },
      ],
      format_customer_no: '{user_id}.{zone_id}',
    },
    'ff': {
      fields: [{ key: 'player_id', label: 'Player ID', type: 'number', required: true, placeholder: 'Contoh: 123456789', helper: 'Lihat di profil, di bawah nickname' }],
      format_customer_no: '{player_id}',
    },
    'gi': {
      fields: [{ key: 'uid', label: 'UID', type: 'number', required: true, placeholder: 'Contoh: 812345678', helper: 'Server Asia diawali angka 8 (9 digit)' }],
      format_customer_no: '{uid}',
    },
    'pb': {
      fields: [{ key: 'player_id', label: 'Character ID', type: 'number', required: true, placeholder: 'Contoh: 5123456789', helper: 'Profil → Character ID (9-10 digit)' }],
      format_customer_no: '{player_id}',
    },
    'vl': {
      fields: [
        { key: 'riot_id', label: 'Riot ID', type: 'text', required: true, placeholder: 'Contoh: BUDIGAMING' },
        { key: 'riot_tag', label: 'Tagline', type: 'text', required: true, placeholder: 'Contoh: 1234', helper: 'Kode setelah tanda #' },
      ],
      format_customer_no: '{riot_id}#{riot_tag}',
    },
    'rb': {
      fields: [{ key: 'username', label: 'Username Roblox', type: 'text', required: true, placeholder: 'Contoh: budi_gaming123', helper: 'Username login, bukan display name' }],
      format_customer_no: '{username}',
    },
    'hsr': {
      fields: [{ key: 'uid', label: 'UID', type: 'number', required: true, placeholder: 'Contoh: 812345678', helper: '9 digit, diawali angka 8' }],
      format_customer_no: '{uid}',
    },
    'hd': {
      fields: [{ key: 'player_id', label: 'Player ID', type: 'number', required: true, placeholder: 'Contoh: 123456789' }],
      format_customer_no: '{player_id}',
    },
    'cod': {
      fields: [{ key: 'player_id', label: 'Player ID / UID', type: 'number', required: true, placeholder: 'Contoh: 6812345678' }],
      format_customer_no: '{player_id}',
    },
    'coc': {
      fields: [{ key: 'player_tag', label: 'Player Tag', type: 'text', required: true, placeholder: 'Contoh: #P0JCQL9', helper: 'Tag diawali # (dari profil)' }],
      format_customer_no: '{player_tag}',
    },
    'stm': {
      fields: [{ key: 'email', label: 'Email Steam', type: 'email', required: true, placeholder: 'email@contoh.com', helper: 'Email yang terdaftar di akun Steam' }],
      format_customer_no: '{email}',
    },
  };

  const inputSchema = (template?.input_schema as any) || FALLBACK_INPUT_SCHEMAS[gameSlug] || {
    fields: [{ key: 'player_id', label: 'ID Pemain', type: 'text', required: true, placeholder: 'Masukkan ID' }],
    format_customer_no: '{player_id}',
  };

  const gameInfo = GAME_INFO[gameSlug];
  if (!gameInfo) notFound();

  // Gunakan DB nominals jika ada, fallback ke hardcoded
  const nominals = (dbNominals && dbNominals.length > 0)
    ? dbNominals.map(n => ({
        id: n.id,
        name: n.name,
        price_sell: Number(n.price_sell),
        buyer_sku_code: n.buyer_sku_code || '',
      }))
    : getFallbackNominals(gameSlug);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <Link href="/topup-game" className="hover:text-primary transition-colors">Top Up Game</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">{gameInfo.name}</span>
      </nav>

      <GameTopUpFlow
        game={{
          name: gameInfo.name,
          slug: gameSlug,
          image: gameInfo.image,
          currency: gameInfo.currency,
        }}
        nominals={nominals}
        inputSchema={inputSchema}
      />
    </div>
  );
}
