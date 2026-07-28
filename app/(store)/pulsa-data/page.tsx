'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Smartphone } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

const operators = [
  { name: 'Telkomsel', logo: '/logos/telkomsel.svg', color: 'border-red-500', bg: 'bg-red-50', text: 'text-red-600' },
  { name: 'XL', logo: '/logos/xl.svg', color: 'border-blue-600', bg: 'bg-blue-50', text: 'text-blue-600' },
  { name: 'Indosat', logo: '/logos/indosat.svg', color: 'border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  { name: 'Tri', logo: '/logos/tri.svg', color: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-600' },
  { name: 'Smartfren', logo: '/logos/smartfren.svg', color: 'border-pink-500', bg: 'bg-pink-50', text: 'text-pink-600' },
  { name: 'Axis', logo: '/logos/axis.svg', color: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' },
];

const pulsaNominals = [5000, 10000, 15000, 20000, 25000, 50000, 75000, 100000];
const dataPakets = [
  { name: '1GB / 30 Hari', price: 12000 },
  { name: '2GB / 30 Hari', price: 20000 },
  { name: '3GB / 30 Hari', price: 28000 },
  { name: '5GB / 30 Hari', price: 40000 },
  { name: '10GB / 30 Hari', price: 65000 },
  { name: '15GB / 30 Hari', price: 85000 },
  { name: '25GB / 30 Hari', price: 110000 },
  { name: 'Unlimited / 30 Hari', price: 150000 },
];

export default function PulsaDataPage() {
  const [activeOp, setActiveOp] = useState('Telkomsel');
  const [tab, setTab] = useState<'pulsa' | 'data'>('pulsa');
  const [phone, setPhone] = useState('');

  const currentOp = operators.find(o => o.name === activeOp) || operators[0];

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">Pulsa & Paket Data</span>
      </nav>

      <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
        <Smartphone size={28} /> Pulsa & Paket Data
      </h1>

      {/* Phone Input */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-soft border border-outline-variant/30">
        <label className="block text-sm font-semibold text-on-surface mb-2">Nomor Handphone</label>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx"
          className="w-full max-w-md bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
      </div>

      {/* Operator Selection with Logos */}
      <div className="flex flex-wrap gap-3">
        {operators.map(op => (
          <button key={op.name} onClick={() => setActiveOp(op.name)}
            className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-3 border-2 ${activeOp === op.name ? `${op.color} ${op.bg} shadow-md` : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:border-primary/40'}`}>
            <img
              src={op.logo}
              alt={op.name}
              className="w-7 h-7 object-contain rounded"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className={`hidden w-7 h-7 rounded ${op.bg} ${op.text} flex items-center justify-center text-[10px] font-bold`}>
              {op.name.slice(0, 2)}
            </span>
            {op.name}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-high rounded-full p-1 w-fit">
        <button onClick={() => setTab('pulsa')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${tab === 'pulsa' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-primary'}`}>Pulsa</button>
        <button onClick={() => setTab('data')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${tab === 'data' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-primary'}`}>Paket Data</button>
      </div>

      {/* Nominals Grid */}
      {tab === 'pulsa' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {pulsaNominals.map(n => (
            <Link key={n} href="/checkout"
              className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-soft shadow-hover-effect text-center group cursor-pointer">
              <div className="flex justify-center mb-2">
                <img src={currentOp.logo} alt={currentOp.name} className="w-8 h-8 object-contain rounded opacity-60 group-hover:opacity-100 transition-opacity"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <p className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors font-[family-name:var(--font-heading)]">
                {formatRupiah(n)}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">Pulsa {activeOp}</p>
              <p className="text-sm font-bold text-primary mt-2">{formatRupiah(n + Math.round(n * 0.03))}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {dataPakets.map((p, i) => (
            <Link key={i} href="/checkout"
              className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-soft shadow-hover-effect flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <img src={currentOp.logo} alt={currentOp.name} className="w-8 h-8 object-contain rounded opacity-60 group-hover:opacity-100 transition-opacity"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div>
                  <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">{p.name}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{activeOp}</p>
                </div>
              </div>
              <p className="text-base font-bold text-primary font-[family-name:var(--font-heading)]">{formatRupiah(p.price)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
