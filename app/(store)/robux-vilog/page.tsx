'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Gamepad2 } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

const packages = [
  { robux: 100, price: 15000 },
  { robux: 200, price: 28000 },
  { robux: 400, price: 52000 },
  { robux: 800, price: 100000 },
  { robux: 1000, price: 120000 },
  { robux: 1700, price: 195000 },
  { robux: 2000, price: 225000 },
  { robux: 4500, price: 490000 },
];

export default function RobuxVilogPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [form, setForm] = useState({ nameUser: '', credential: '', password: '', backupCodes: '' });

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">Robux Vilog</span>
      </nav>

      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
          <Gamepad2 size={28} /> Robux Vilog
        </h1>
        <p className="text-sm text-on-surface-variant mt-2">Topup Robux via Login — Owner login langsung ke akun Anda untuk mengisi Robux.</p>
      </div>

      {/* Package Selection */}
      <div>
        <h2 className="text-lg font-bold text-on-surface mb-3 font-[family-name:var(--font-heading)]">Pilih Paket Robux</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {packages.map((pkg, i) => (
            <button key={i} onClick={() => setSelected(i)}
              className={`rounded-xl p-4 border-2 text-center transition-all ${selected === i ? 'border-primary bg-primary/5 shadow-md' : 'border-outline-variant/30 bg-surface-container-lowest shadow-soft hover:border-primary/50'}`}>
              <p className="text-2xl font-bold text-on-surface font-[family-name:var(--font-heading)]">R$ {pkg.robux}</p>
              <p className="text-sm font-bold text-primary mt-1">{formatRupiah(pkg.price)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-soft border border-outline-variant/30 space-y-4">
        <h2 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">Data Akun Roblox</h2>
        <p className="text-xs text-on-surface-variant">Data Anda aman dan hanya digunakan untuk proses topup.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Name + Username Roblox</label>
            <input type="text" value={form.nameUser} onChange={e => setForm({...form, nameUser: e.target.value})} placeholder="Name + Username"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Username / Email / Ponsel</label>
            <input type="text" value={form.credential} onChange={e => setForm({...form, credential: e.target.value})} placeholder="Login credential"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Password akun"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">3 Kode Backup</label>
            <input type="text" value={form.backupCodes} onChange={e => setForm({...form, backupCodes: e.target.value})} placeholder="Kode1, Kode2, Kode3"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          </div>
        </div>

        <Link href="/checkout"
          className={`w-full py-3 rounded-full text-white text-sm font-semibold text-center block transition-all ${selected !== null ? 'gradient-primary hover:opacity-90' : 'bg-gray-300 cursor-not-allowed'}`}>
          Konfirmasi & Bayar {selected !== null ? formatRupiah(packages[selected].price) : ''}
        </Link>
      </div>
    </div>
  );
}
