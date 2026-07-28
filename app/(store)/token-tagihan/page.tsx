'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Zap } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

const tokenNominals = [20000, 50000, 100000, 200000, 500000, 1000000];
const tagihanTypes = ['BPJS', 'PDAM', 'Telkom', 'Multifinance'];

export default function TokenTagihanPage() {
  const [tab, setTab] = useState<'token' | 'tagihan'>('token');
  const [input, setInput] = useState('');

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">Token & Tagihan</span>
      </nav>

      <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
        <Zap size={28} /> Token & Tagihan
      </h1>

      {/* Input */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-soft border border-outline-variant/30">
        <label className="block text-sm font-semibold text-on-surface mb-2">
          {tab === 'token' ? 'No. Meter / ID Pelanggan' : 'ID Pelanggan'}
        </label>
        <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={tab === 'token' ? '1234567890' : 'Masukkan ID Pelanggan'}
          className="w-full max-w-md bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-high rounded-full p-1 w-fit">
        <button onClick={() => setTab('token')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${tab === 'token' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-primary'}`}>Token Listrik</button>
        <button onClick={() => setTab('tagihan')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${tab === 'tagihan' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-primary'}`}>Tagihan</button>
      </div>

      {tab === 'token' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {tokenNominals.map(n => (
            <Link key={n} href="/checkout"
              className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 shadow-soft shadow-hover-effect text-center group">
              <Zap size={24} className="mx-auto mb-2 text-amber-500" />
              <p className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors font-[family-name:var(--font-heading)]">{formatRupiah(n)}</p>
              <p className="text-xs text-on-surface-variant mt-1">Token PLN</p>
              <p className="text-sm font-bold text-primary mt-2">{formatRupiah(n + Math.round(n * 0.02))}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tagihanTypes.map(t => (
            <div key={t} className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 shadow-soft shadow-hover-effect flex items-center justify-between group cursor-pointer">
              <div>
                <p className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">{t}</p>
                <p className="text-xs text-on-surface-variant mt-1">Cek & bayar tagihan</p>
              </div>
              <button className="px-4 py-2 rounded-full gradient-primary text-white text-xs font-semibold">Cek Tagihan</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
