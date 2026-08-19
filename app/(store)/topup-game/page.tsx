import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ChevronRight, Zap, Gamepad2, UserCheck } from 'lucide-react';

export const metadata = { title: 'Top Up Game' };

interface GameRow {
  game_name: string;
  game_slug: string;
  image_url: string | null;
  brand: string;
}

export default async function TopUpGamePage() {
  const supabase = await createClient();

  // Ambil game unik dari DB — hanya yang aktif (Digiflazz)
  const { data: products } = await supabase
    .from('products')
    .select('game_name, game_slug, image_url, brand')
    .eq('module', 'digiflazz')
    .eq('is_active', true)
    .not('game_slug', 'is', null)
    .not('game_name', 'is', null);

  // Ambil Robux/Vilog (produk manual)
  const { data: robuxProducts } = await supabase
    .from('products')
    .select('id, name, image_url')
    .eq('module', 'manual_robux')
    .eq('is_active', true)
    .limit(1);

  const hasRobux = robuxProducts && robuxProducts.length > 0;
  const robuxImage = hasRobux ? robuxProducts[0].image_url : null;

  // Group by game_slug — satu kartu per game
  const gameMap = new Map<string, GameRow>();
  for (const p of (products ?? [])) {
    if (p.game_slug && !gameMap.has(p.game_slug)) {
      gameMap.set(p.game_slug, {
        game_name: p.game_name!,
        game_slug: p.game_slug!,
        image_url: p.image_url,
        brand: p.brand ?? '',
      });
    }
  }
  const games = Array.from(gameMap.values()).sort((a, b) => a.game_name.localeCompare(b.game_name));

  const totalGames = games.length + (hasRobux ? 1 : 0);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">Top Up Game</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)] mb-2">Top Up Game</h1>
        <p className="text-sm text-on-surface-variant">
          {totalGames} game tersedia — pilih game lalu pilih nominal top up
        </p>
      </div>

      {/* Grid */}
      {totalGames === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
          <Gamepad2 size={48} className="mx-auto mb-4 text-on-surface-variant/30" />
          <p className="text-sm text-on-surface-variant font-semibold">Belum ada game tersedia.</p>
          <p className="text-xs text-on-surface-variant mt-1">Owner perlu sync & aktifkan game di panel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {/* Robux/Vilog card — manual via login */}
          {hasRobux && (
            <Link
              href="/robux-vilog"
              className="group bg-white rounded-2xl border border-surface-dim overflow-hidden shadow-soft shadow-hover-effect flex flex-col h-full cursor-pointer"
            >
              <div className="h-36 w-full relative overflow-hidden bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                {robuxImage ? (
                  <img src={robuxImage} alt="Robux Vilog" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <Gamepad2 size={32} className="text-purple-400" />
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-on-surface leading-tight mb-0.5 group-hover:text-primary transition-colors">Robux / Vilog</h3>
                  <p className="text-xs text-on-surface-variant">Roblox</p>
                </div>
                <div className="mt-2 flex items-center text-[10px] font-semibold text-purple-600 bg-purple-50 rounded-full px-2 py-1 w-fit border border-purple-200">
                  <UserCheck size={12} className="mr-0.5" />
                  Manual · via Login
                </div>
              </div>
            </Link>
          )}

          {/* Digiflazz games */}
          {games.map(g => (
            <Link
              key={g.game_slug}
              href={`/topup-game/${g.game_slug}`}
              className="group bg-white rounded-2xl border border-surface-dim overflow-hidden shadow-soft shadow-hover-effect flex flex-col h-full cursor-pointer"
            >
              <div className="h-36 w-full relative overflow-hidden bg-surface-variant flex items-center justify-center">
                {g.image_url ? (
                  <img src={g.image_url} alt={g.game_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <Gamepad2 size={32} className="text-outline-variant" />
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-on-surface leading-tight mb-0.5 group-hover:text-primary transition-colors">{g.game_name}</h3>
                  <p className="text-xs text-on-surface-variant truncate">{g.brand}</p>
                </div>
                <div className="mt-2 flex items-center text-[10px] font-semibold text-secondary bg-secondary-fixed/30 rounded-full px-2 py-1 w-fit">
                  <Zap size={12} className="mr-0.5" />
                  Proses Instan
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

