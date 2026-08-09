'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Package, ShoppingCart, Users, Image, Settings,
  Link2, Menu, X, LogOut, ShieldCheck, HelpCircle,
  Wallet, Gamepad2, Smartphone, Zap, CreditCard, Share2,
  Bot, Crown, FileText, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';
import { createClient } from '@/lib/supabase/client';

const panelNav = [
  { icon: Home, label: 'Dasbor', href: '/panel/x7k9m2-daya-owner', exact: true },
  { icon: Link2, label: 'Koneksi & API', href: '/panel/x7k9m2-daya-owner/api' },
  { icon: Wallet, label: 'Saldo Provider', href: '/panel/x7k9m2-daya-owner/saldo' },
  { icon: Gamepad2, label: 'Top Up Game', href: '/panel/x7k9m2-daya-owner/topup-game' },
  { icon: Smartphone, label: 'Pulsa, Data & Token', href: '/panel/x7k9m2-daya-owner/pulsa-data-token' },
  { icon: CreditCard, label: 'E-Wallet', href: '/panel/x7k9m2-daya-owner/ewallet' },
  { icon: Share2, label: 'SMM Panel', href: '/panel/x7k9m2-daya-owner/smm-panel' },
  { icon: Bot, label: 'Robux & Vilog', href: '/panel/x7k9m2-daya-owner/robux-vilog' },
  { icon: ShieldCheck, label: 'Nokos', href: '/panel/x7k9m2-daya-owner/nokos' },
  { icon: Crown, label: 'Aplikasi Premium', href: '/panel/x7k9m2-daya-owner/app-premium' },
  { icon: FileText, label: 'Format Pesan', href: '/panel/x7k9m2-daya-owner/format-pesan' },
  { icon: Users, label: 'Manajemen User', href: '/panel/x7k9m2-daya-owner/user' },
  { icon: Image, label: 'Banner', href: '/panel/x7k9m2-daya-owner/banner' },
  { icon: ShoppingCart, label: 'Transaksi', href: '/panel/x7k9m2-daya-owner/pesanan' },
  { icon: HelpCircle, label: 'Bantuan & FAQ', href: '/panel/x7k9m2-daya-owner/bantuan' },
  { icon: Settings, label: 'Pengaturan', href: '/panel/x7k9m2-daya-owner/pengaturan' },
];

export default function OwnerPanelShell({ ownerName, children }: { ownerName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 mb-8 px-2">
        <Logo size={36} />
        <div>
          <h1 className="text-xl font-bold text-primary tracking-tight font-[family-name:var(--font-heading)]">DAYA MART</h1>
          <p className="text-xs text-on-surface-variant">Owner Panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {panelNav.map((item) => {
          const active = isActive(item.href, (item as { exact?: boolean }).exact);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg border-l-4 transition-all duration-200',
                active
                  ? 'border-primary bg-primary/5 text-primary font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
              )}>
              <Icon size={20} />
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-outline-variant space-y-2">
        <Link href="/" className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-surface-container-high">
          <Home size={18} /> Ke Store
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/5 transition-colors rounded-lg w-full">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[280px] z-50 bg-surface border-r border-outline-variant shadow-sm hidden lg:flex flex-col p-6 safe-area-pad">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 h-dvh w-[280px] z-[70] bg-surface shadow-xl flex flex-col p-6 animate-slide-in-left lg:hidden safe-area-pad">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Close menu">
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-[280px] flex flex-col min-h-dvh">
        {/* Top Bar — hamburger → search → avatar, all inline flex */}
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md shadow-sm border-b border-outline-variant">
          <div className="flex items-center gap-3 px-4 lg:px-10 py-3">
            {/* Hamburger — only mobile, 44px fixed, NOT absolute */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-11 h-11 shrink-0 rounded-full bg-surface-container-lowest border border-outline-variant/50 shadow-sm flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Search — flex-1, min-w-0 so it never gets overlapped */}
            <div className="flex-1 min-w-0 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <input type="text" placeholder="Cari transaksi, produk, atau pelanggan..."
                className="block w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-full bg-surface-container-lowest text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder-on-surface-variant/70" />
            </div>

            {/* Avatar & Name */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-8 w-px bg-outline-variant hidden sm:block" />
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                  {ownerName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-on-surface hidden lg:block">{ownerName}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-10 max-w-[1280px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
