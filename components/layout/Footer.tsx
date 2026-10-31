import Link from 'next/link';
import { ShieldCheck, Lock } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

export default function Footer() {
  return (
    <footer className="w-full pt-16 pb-6 border-t border-outline-variant bg-surface-container-low mt-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 px-6 lg:px-10 max-w-[1280px] mx-auto mb-10">
        {/* Col 1: Brand */}
        <div className="sm:col-span-2 lg:col-span-1 space-y-4">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <h2 className="text-xl font-bold text-primary font-[family-name:var(--font-heading)]">DAYA MART</h2>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Platform Top Up Game, Pulsa, dan Produk Digital terpercaya. One Stop Digital Store untuk semua kebutuhan digitalmu.
          </p>
          <div className="flex items-center gap-4 text-on-surface-variant">
            {/* WhatsApp */}
            <a href="https://wa.me/6287800001232" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="WhatsApp">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            {/* Instagram */}
            <a href="#" className="hover:text-primary transition-colors" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            {/* Telegram */}
            <a href="#" className="hover:text-primary transition-colors" aria-label="Telegram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
            {/* TikTok */}
            <a href="#" className="hover:text-primary transition-colors" aria-label="TikTok">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </a>
          </div>
        </div>

        {/* Col 2: Kategori */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-on-surface uppercase tracking-wider">Kategori Produk</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/topup-game" className="text-on-surface-variant hover:text-primary transition-colors">Top Up Game</Link></li>
            <li><Link href="/app-premium" className="text-on-surface-variant hover:text-primary transition-colors">App Premium</Link></li>
            <li><Link href="/pulsa-data" className="text-on-surface-variant hover:text-primary transition-colors">Pulsa & Paket Data</Link></li>
            <li><Link href="/token-tagihan" className="text-on-surface-variant hover:text-primary transition-colors">Token & Tagihan</Link></li>
            <li><Link href="/smm-panel" className="text-on-surface-variant hover:text-primary transition-colors">Sosial Media</Link></li>
          </ul>
        </div>

        {/* Col 3: Bantuan */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-on-surface uppercase tracking-wider">Bantuan</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/bantuan" className="text-on-surface-variant hover:text-primary transition-colors">FAQ</Link></li>
            <li><a href="https://wa.me/6287800001232" target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">Hubungi Kami</a></li>
            <li><Link href="/bantuan" className="text-on-surface-variant hover:text-primary transition-colors">Syarat & Ketentuan</Link></li>
            <li><Link href="/bantuan" className="text-on-surface-variant hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
          </ul>
        </div>

        {/* Col 4: Payment */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-on-surface uppercase tracking-wider">Pembayaran</h3>
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-outline-variant shadow-sm">
            <svg width="40" height="16" viewBox="0 0 100 40" fill="none"><rect width="100" height="40" rx="4" fill="#fff"/><text x="50" y="25" textAnchor="middle" fill="#00529C" fontSize="14" fontWeight="bold" fontFamily="Arial">QRIS</text></svg>
          </div>
          <p className="text-xs text-on-surface-variant">Bayar apa pun cukup scan QRIS</p>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1 text-on-surface-variant text-xs">
              <ShieldCheck size={14} />
              <span>100% Amanah</span>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant text-xs">
              <Lock size={14} />
              <span>Transaksi Aman</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="text-center text-xs text-on-surface-variant border-t border-outline-variant/30 pt-4 max-w-[1280px] mx-auto px-6">
        © 2026 DAYA MART. All rights reserved. | 100% Amanah & Terpercaya
      </div>
    </footer>
  );
}
