'use client';

import { CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function EwalletPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
          <CreditCard size={28} className="text-primary" /> E-Wallet
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">Kelola produk e-wallet (DANA, OVO, GoPay, ShopeePay).</p>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-soft p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center">
          <CreditCard size={36} className="text-white" />
        </div>
        <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)] mb-2">Halaman Sedang Dikembangkan</h3>
        <p className="text-sm text-on-surface-variant mb-6 max-w-md mx-auto">Fitur ini sedang dalam pengembangan. Kelola produk e-wallet melalui halaman Produk umum.</p>
        <Link href="/panel/x7k9m2-daya-owner/produk" className="inline-flex items-center gap-2 px-6 py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all">
          Kelola di Halaman Produk <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
