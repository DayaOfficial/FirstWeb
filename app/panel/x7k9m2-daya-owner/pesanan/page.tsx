'use client';

import { ShoppingCart, Search, Eye, Clock, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const sampleOrders = [
  { id: '#DM-8921', customer: 'Andi Nugroho', product: 'ML 344 Diamonds', category: 'Top Up Game', amount: 85000, paymentStatus: 'completed', processStatus: 'success', date: '26 Jul 2026, 14:30' },
  { id: '#DM-8920', customer: 'Siti Rahma', product: 'Netflix Premium 1 Bulan', category: 'App Premium', amount: 120000, paymentStatus: 'completed', processStatus: 'success', date: '26 Jul 2026, 13:15' },
  { id: '#DM-8919', customer: 'Budi Wibowo', product: 'Pulsa Telkomsel 100rb', category: 'Pulsa', amount: 98500, paymentStatus: 'completed', processStatus: 'processing', date: '26 Jul 2026, 12:00' },
  { id: '#DM-8918', customer: 'Citra Ayu', product: 'Token PLN 50.000', category: 'Token', amount: 51000, paymentStatus: 'expired', processStatus: 'canceled', date: '26 Jul 2026, 10:45' },
  { id: '#DM-8917', customer: 'Dian Pratama', product: 'IG Followers 1K', category: 'SMM', amount: 15000, paymentStatus: 'completed', processStatus: 'success', date: '25 Jul 2026, 21:30' },
  { id: '#DM-8916', customer: 'Eka Fitri', product: 'Spotify Premium 1 Bulan', category: 'App Premium', amount: 15000, paymentStatus: 'pending', processStatus: 'waiting', date: '25 Jul 2026, 20:00' },
];

const processColors: Record<string, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  waiting: 'bg-amber-50 text-amber-700 border-amber-200',
  canceled: 'bg-red-50 text-red-700 border-red-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

const processLabels: Record<string, string> = {
  success: 'Selesai',
  processing: 'Diproses',
  waiting: 'Menunggu',
  canceled: 'Dibatalkan',
  failed: 'Gagal',
};

export default function OwnerPesananPage() {
  const [search, setSearch] = useState('');

  const filtered = sampleOrders.filter(o =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.customer.toLowerCase().includes(search.toLowerCase()) ||
    o.product.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
            <ShoppingCart size={28} className="text-primary" />
            Pesanan
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">Kelola dan pantau semua pesanan masuk.</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pesanan..."
            className="w-full sm:w-72 bg-surface-container-lowest border border-outline-variant rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-soft border border-outline-variant/20 text-center">
          <p className="text-2xl font-bold text-on-surface font-[family-name:var(--font-heading)]">156</p>
          <p className="text-xs text-on-surface-variant mt-1">Total Pesanan</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-soft border border-outline-variant/20 text-center">
          <p className="text-2xl font-bold text-green-600 font-[family-name:var(--font-heading)]">142</p>
          <p className="text-xs text-on-surface-variant mt-1">Selesai</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-soft border border-outline-variant/20 text-center">
          <p className="text-2xl font-bold text-blue-600 font-[family-name:var(--font-heading)]">8</p>
          <p className="text-xs text-on-surface-variant mt-1">Diproses</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-soft border border-outline-variant/20 text-center">
          <p className="text-2xl font-bold text-red-600 font-[family-name:var(--font-heading)]">6</p>
          <p className="text-xs text-on-surface-variant mt-1">Dibatalkan</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-soft overflow-hidden border border-outline-variant/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container/50 border-b border-outline-variant">
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Order ID</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Pelanggan</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Produk</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tanggal</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3 px-5 text-sm font-mono font-semibold text-on-surface">{order.id}</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full gradient-primary text-white flex items-center justify-center text-[10px] font-bold">
                        {order.customer.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm text-on-surface">{order.customer}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <span className="text-sm text-on-surface block">{order.product}</span>
                    <span className="text-[10px] text-on-surface-variant">{order.category}</span>
                  </td>
                  <td className="py-3 px-5 text-sm font-semibold text-on-surface">{formatRupiah(order.amount)}</td>
                  <td className="py-3 px-5">
                    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border', processColors[order.processStatus] || '')}>
                      {processLabels[order.processStatus] || order.processStatus}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-xs text-on-surface-variant">{order.date}</td>
                  <td className="py-3 px-5 text-right">
                    <button className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors">
                      <Eye size={16} />
                    </button>
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
