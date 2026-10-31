'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, Home, Gamepad2, Crown, Smartphone, Zap,
  ShieldCheck, Share2, Wallet, HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';

export const STORE_NAV = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/topup-game', label: 'Top Up Game', icon: Gamepad2 },
  { href: '/app-premium', label: 'App Premium', icon: Crown },
  { href: '/pulsa-data', label: 'Pulsa & Paket Data', icon: Smartphone },
  { href: '/token-tagihan', label: 'Token & Tagihan', icon: Zap },
  { href: '/nokos', label: 'Nokos', icon: ShieldCheck },
  { href: '/smm-panel', label: 'Sosial Media', icon: Share2 },
  { href: '/ewallet', label: 'E-Wallet', icon: Wallet },
  { href: '/bantuan', label: 'Bantuan', icon: HelpCircle },
];

export default function StoreTopBar({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* ── DESKTOP SIDEBAR (lg+) ── */}
      <aside className="fixed left-0 top-0 h-full w-[280px] z-50 bg-surface border-r border-outline-variant shadow-sm hidden lg:flex flex-col p-6">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="text-base font-extrabold text-primary font-[family-name:var(--font-heading)] tracking-tight">
                DAYA MART
              </h1>
              <p className="text-[10px] text-on-surface-variant font-semibold">One Stop Digital Store</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {STORE_NAV.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'gradient-primary text-white shadow-md'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                )}>
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── MOBILE DRAWER (< lg) ── */}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-surface shadow-2xl flex flex-col overflow-y-auto animate-slide-in-left">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <Logo size={28} />
                <span className="font-extrabold text-primary font-[family-name:var(--font-heading)]">DAYA MART</span>
              </Link>
              <button onClick={() => setOpen(false)} aria-label="Tutup menu"
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors">
                <X size={20} className="text-on-surface-variant" />
              </button>
            </div>
            <nav className="p-3 flex flex-col gap-1">
              {STORE_NAV.map(item => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      isActive
                        ? 'gradient-primary text-white shadow-md'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    )}>
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* ── HAMBURGER BUTTON inject into TopBar ── */}
      {/* We expose the open function via a hidden button that TopBar can trigger */}
      <button
        id="store-hamburger-trigger"
        onClick={() => setOpen(true)}
        aria-label="Buka menu navigasi"
        className="lg:hidden w-11 h-11 shrink-0 rounded-full bg-surface-container-lowest border border-outline-variant/50 shadow-sm flex items-center justify-center text-primary hover:bg-primary/5 transition-colors active:scale-95"
      >
        <Menu size={22} />
      </button>

      {children}
    </>
  );
}
