'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Wallet } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

const wallets = [
  { name: 'DANA', logo: '/logos/dana.svg', color: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
  { name: 'OVO', logo: '/logos/ovo.svg', color: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' },
  { name: 'GoPay', logo: '/logos/gopay.svg', color: 'border-green-500', bg: 'bg-green-50', text: 'text-green-600' },
  { name: 'ShopeePay', logo: '/logos/shopeepay.svg', color: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-600' },
  { name: 'LinkAja', logo: '/logos/linkaja.svg', color: 'border-red-500', bg: 'bg-red-50', text: 'text-red-600' },
];

const nominals = [10000, 20000, 25000, 50000, 75000, 100000, 150000, 200000, 300000, 500000];

export default function EWalletPage() {
  const [activeWallet, setActiveWallet] = useState('DANA');
  const [phone, setPhone] = useState('');

  const currentWallet = wallets.find(w => w.name === activeWallet) || wallets[0];

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">E-Wallet</span>
      </nav>

      <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
        <Wallet size={28} /> Top Up E-Wallet
      </h1>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-soft border border-outline-variant/30">
        <label className="block text-sm font-semibold text-on-surface mb-2">Nomor Handphone</label>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx"
          className="w-full max-w-md bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
      </div>

      {/* E-Wallet Selection with Logos */}
      <div className="flex flex-wrap gap-3">
        {wallets.map(w => (
          <button key={w.name} onClick={() => setActiveWallet(w.name)}
            className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-3 border-2 ${activeWallet === w.name ? `${w.color} ${w.bg} shadow-md` : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:border-primary/40'}`}>
            <img
              src={w.logo}
              alt={w.name}
              className="w-7 h-7 object-contain rounded"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className={`hidden w-7 h-7 rounded ${w.bg} ${w.text} flex items-center justify-center text-[10px] font-bold`}>
              {w.name.slice(0, 2)}
            </span>
            {w.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {nominals.map(n => (
          <Link key={n} href="/checkout"
            className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-soft shadow-hover-effect text-center group">
            <div className="flex justify-center mb-2">
              <img
                src={currentWallet.logo}
                alt={currentWallet.name}
                className="w-8 h-8 object-contain rounded opacity-60 group-hover:opacity-100 transition-opacity"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <p className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors font-[family-name:var(--font-heading)]">{formatRupiah(n)}</p>
            <p className="text-xs text-on-surface-variant mt-1">{activeWallet}</p>
            <p className="text-sm font-bold text-primary mt-2">{formatRupiah(n + Math.round(n * 0.02))}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
