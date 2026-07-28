'use client';

import Link from 'next/link';
import { ChevronRight, Satellite, Search } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

const services = [
  { name: 'Desain Logo', desc: 'Logo profesional untuk brand Anda', price: 50000 },
  { name: 'Desain Banner', desc: 'Banner promosi media sosial', price: 30000 },
  { name: 'Edit Video', desc: 'Edit video pendek untuk konten', price: 75000 },
  { name: 'Joki Rank ML', desc: 'Push rank Mobile Legends', price: 35000 },
  { name: 'Joki Rank FF', desc: 'Push rank Free Fire', price: 30000 },
  { name: 'Setup Website', desc: 'Pembuatan website sederhana', price: 500000 },
  { name: 'Bot WhatsApp', desc: 'Setup bot WA untuk bisnis', price: 150000 },
  { name: 'Script Panel', desc: 'Script & tools digital', price: 100000 },
];

export default function JasaDigitalPage() {
  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">Jasa Digital</span>
      </nav>

      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
          <Satellite size={28} /> Jasa Digital
        </h1>
        <p className="text-sm text-on-surface-variant mt-2">Berbagai layanan jasa digital untuk kebutuhan Anda.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {services.map((s, i) => (
          <div key={i} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-soft shadow-hover-effect p-5 flex flex-col group">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-white font-[family-name:var(--font-heading)]">{s.name[0]}</span>
            </div>
            <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">{s.name}</h3>
            <p className="text-xs text-on-surface-variant mt-1 flex-1">{s.desc}</p>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-lg font-bold text-primary font-[family-name:var(--font-heading)]">{formatRupiah(s.price)}</p>
              <Link href="/checkout" className="px-4 py-2 rounded-full gradient-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity">Order</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
