'use client';

import { useState } from 'react';
import { Package, Search, Plus, Edit3, Trash2, Eye, EyeOff, Filter } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { cn } from '@/lib/utils';

const sampleProducts = [
  { id: '1', name: 'Mobile Legends 86 Diamonds', category: 'Top Up Game', module: 'digiflazz', priceSell: 19000, stock: 999, isActive: true },
  { id: '2', name: 'Mobile Legends 172 Diamonds', category: 'Top Up Game', module: 'digiflazz', priceSell: 37000, stock: 999, isActive: true },
  { id: '3', name: 'Free Fire 100 Diamonds', category: 'Top Up Game', module: 'digiflazz', priceSell: 15000, stock: 999, isActive: true },
  { id: '4', name: 'Netflix Premium 1 Bulan', category: 'App Premium', module: 'manual_app', priceSell: 45000, stock: 50, isActive: true },
  { id: '5', name: 'Spotify Premium 1 Bulan', category: 'App Premium', module: 'manual_app', priceSell: 15000, stock: 100, isActive: true },
  { id: '6', name: 'Telkomsel Pulsa 10.000', category: 'Pulsa', module: 'digiflazz', priceSell: 11500, stock: 999, isActive: true },
  { id: '7', name: 'Instagram Followers 1K', category: 'SMM Panel', module: 'jokerpanel', priceSell: 15000, stock: 999, isActive: false },
];

export default function OwnerProdukPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = sampleProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.category === filter;
    return matchSearch && matchFilter;
  });

  const categories = ['all', ...new Set(sampleProducts.map(p => p.category))];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
            <Package size={28} className="text-primary" />
            Produk
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">Kelola produk dan layanan yang dijual.</p>
        </div>
        <button className="px-5 py-2.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center gap-2">
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={cn('px-4 py-2 rounded-full text-xs font-semibold transition-all',
                filter === cat ? 'gradient-primary text-white shadow-md' : 'bg-surface-container-high border border-outline-variant text-on-surface hover:border-primary hover:text-primary'
              )}>
              {cat === 'all' ? 'Semua' : cat}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk..."
            className="w-full sm:w-64 bg-surface-container-lowest border border-outline-variant rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-soft overflow-hidden border border-outline-variant/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-container/50 border-b border-outline-variant">
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Produk</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Kategori</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Module</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Harga</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Stok</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3 px-5 text-sm font-semibold text-on-surface">{product.name}</td>
                  <td className="py-3 px-5 text-sm text-on-surface-variant">{product.category}</td>
                  <td className="py-3 px-5">
                    <span className="text-xs font-mono bg-surface-container-high px-2 py-1 rounded">{product.module}</span>
                  </td>
                  <td className="py-3 px-5 text-sm font-semibold text-on-surface">{formatRupiah(product.priceSell)}</td>
                  <td className="py-3 px-5 text-sm text-on-surface-variant">{product.stock}</td>
                  <td className="py-3 px-5">
                    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border',
                      product.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                    )}>
                      {product.isActive ? <><Eye size={10} /> Aktif</> : <><EyeOff size={10} /> Nonaktif</>}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"><Edit3 size={14} /></button>
                      <button className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/5 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
