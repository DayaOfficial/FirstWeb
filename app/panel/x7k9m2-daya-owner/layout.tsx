'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Package, ShoppingCart, Users, Image, Bell,
  Settings, BarChart3, Link2, Menu, X, LogOut,
  ShieldCheck, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';

const panelNav = [
  { icon: Home, label: 'Dashboard', href: '/panel/x7k9m2-daya-owner', exact: true },
  { icon: Link2, label: 'Koneksi API', href: '/panel/x7k9m2-daya-owner/api' },
  { icon: Package, label: 'Produk', href: '/panel/x7k9m2-daya-owner/produk' },
  { icon: ShieldCheck, label: 'Nokos', href: '/panel/x7k9m2-daya-owner/nokos' },
  { icon: Image, label: 'Banner', href: '/panel/x7k9m2-daya-owner/banner' },
  { icon: ShoppingCart, label: 'Pesanan', href: '/panel/x7k9m2-daya-owner/pesanan' },
  { icon: Users, label: 'User', href: '/panel/x7k9m2-daya-owner/user' },
  { icon: HelpCircle, label: 'Bantuan & FAQ', href: '/panel/x7k9m2-daya-owner/bantuan' },
  { icon: Bell, label: 'Notifikasi', href: '/panel/x7k9m2-daya-owner/notifikasi' },
  { icon: BarChart3, label: 'Laporan', href: '/panel/x7k9m2-daya-owner/laporan' },
  { icon: Settings, label: 'Pengaturan', href: '/panel/x7k9m2-daya-owner/pengaturan' },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);

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
        <button className="flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/5 transition-colors rounded-lg w-full">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[280px] z-50 bg-surface border-r border-outline-variant shadow-sm hidden lg:flex flex-col p-6">
        {sidebarContent}
      </aside>

      {/* Mobile */}
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-surface shadow-soft border border-outline-variant text-primary" aria-label="Open menu">
        <Menu size={24} />
      </button>
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-[280px] z-[70] bg-surface shadow-xl flex flex-col p-6 animate-slide-in-left lg:hidden">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant" aria-label="Close menu">
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md shadow-sm border-b border-outline-variant flex items-center justify-between px-6 lg:px-10 py-3">
          <div className="relative w-full max-w-md">
            <input type="text" placeholder="Cari transaksi, produk, atau pelanggan..."
              className="block w-full pl-4 pr-4 py-2 border border-outline-variant rounded-full bg-surface-container-lowest text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder-on-surface-variant/70" />
          </div>
          <div className="flex items-center gap-3 ml-4">
            <button className="p-2 rounded-full hover:bg-primary/5 text-on-surface-variant relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
            </button>
            <div className="h-8 w-px bg-outline-variant" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">O</div>
              <span className="text-sm font-semibold text-on-surface hidden lg:block">Admin Owner</span>
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
