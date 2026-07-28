'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Gamepad2, Crown, Smartphone, Zap, ShieldCheck,
  Share2, Wallet, HelpCircle, MessageCircle,
  Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';

const navItems = [
  { icon: Home, label: 'Beranda', href: '/' },
  { icon: Gamepad2, label: 'Top Up Game', href: '/topup-game' },
  { icon: Crown, label: 'App Premium', href: '/app-premium' },
  { icon: Smartphone, label: 'Pulsa & Paket Data', href: '/pulsa-data' },
  { icon: Zap, label: 'Token & Tagihan', href: '/token-tagihan' },
  { icon: ShieldCheck, label: 'Nokos', href: '/nokos' },
  { icon: Share2, label: 'Sosial Media', href: '/smm-panel' },
  { icon: Wallet, label: 'E-Wallet', href: '/ewallet' },
  { icon: HelpCircle, label: 'Bantuan', href: '/bantuan' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <Logo size={40} />
        <div>
          <h1 className="text-xl font-bold text-primary tracking-tight font-[family-name:var(--font-heading)]">
            DAYA MART
          </h1>
          <p className="text-xs text-on-surface-variant">Digital Store</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg border-l-4 transition-all duration-200 group',
                active
                  ? 'border-primary bg-primary/5 text-primary font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
              )}
            >
              <Icon size={20} className={cn(active && 'text-primary')} />
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* CTA */}
      <div className="mt-auto pt-6 border-t border-outline-variant">
        <a
          href="https://wa.me/6287800001232"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-4 rounded-full gradient-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-soft"
        >
          <MessageCircle size={16} />
          Chat WhatsApp
        </a>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[280px] z-50 bg-surface border-r border-outline-variant shadow-sm hidden lg:flex flex-col p-6">
        {sidebarContent}
      </aside>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-surface shadow-soft border border-outline-variant text-primary"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="fixed left-0 top-0 h-full w-[280px] z-[70] bg-surface shadow-xl flex flex-col p-6 animate-slide-in-left lg:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
