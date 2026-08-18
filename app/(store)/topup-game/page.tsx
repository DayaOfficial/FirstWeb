import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ChevronRight, Zap, Gamepad2 } from 'lucide-react';

export const metadata = { title: 'Top Up Game' };

interface GameRow {
  game_name: string;
  game_slug: string;
  image_url: string | null;
  brand: string;
}

export default async function TopUpGamePage() {
  const supabase = await createClient();

  // Ambil game unik dari DB — hanya yang aktif
  const { data: products } = await supabase
    .from('products')
    .select('game_name, game_slug, image_url, brand')
    .eq('module', 'digiflazz')
    .eq('is_active', true)
    .not('game_slug', 'is', null)
    .not('game_name', 'is', null);

  // Group by game_slug → satu kartu per game
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
          {games.length} game tersedia — pilih game lalu pilih nominal top up
        </p>
      </div>

      {/* Grid */}
      {games.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
          <Gamepad2 size={48} className="mx-auto mb-4 text-on-surface-variant/30" />
          <p className="text-sm text-on-surface-variant font-semibold">Belum ada game tersedia.</p>
          <p className="text-xs text-on-surface-variant mt-1">Owner perlu sync & aktifkan game di panel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
