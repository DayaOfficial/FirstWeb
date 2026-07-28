'use client';

import { BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

const monthlyData = [
  { month: 'Jan', revenue: 32000000, orders: 180 },
  { month: 'Feb', revenue: 28000000, orders: 155 },
  { month: 'Mar', revenue: 35000000, orders: 210 },
  { month: 'Apr', revenue: 42000000, orders: 245 },
  { month: 'May', revenue: 38000000, orders: 220 },
  { month: 'Jun', revenue: 45000000, orders: 280 },
  { month: 'Jul', revenue: 48000000, orders: 310 },
];

const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

export default function OwnerLaporanPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
          <BarChart3 size={28} className="text-primary" />
          Laporan
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">Ringkasan laporan keuangan dan performa bisnis.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-soft border border-outline-variant/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg"><DollarSign size={20} /></div>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><TrendingUp size={12} /> +12.5%</span>
          </div>
          <p className="text-xs text-on-surface-variant">Total Pendapatan (Bulan Ini)</p>
          <p className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)] mt-1">Rp 48.2M</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-soft border border-outline-variant/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-secondary/10 text-secondary rounded-lg"><ShoppingCart size={20} /></div>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><TrendingUp size={12} /> +8.2%</span>
          </div>
          <p className="text-xs text-on-surface-variant">Total Pesanan</p>
          <p className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)] mt-1">310</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-soft border border-outline-variant/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-tertiary/10 text-tertiary rounded-lg"><Users size={20} /></div>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><TrendingDown size={12} /> -2.4%</span>
          </div>
          <p className="text-xs text-on-surface-variant">Pelanggan Baru</p>
          <p className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)] mt-1">42</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-soft border border-outline-variant/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-pink-100 text-pink-600 rounded-lg"><TrendingUp size={20} /></div>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><TrendingUp size={12} /> +15.3%</span>
          </div>
          <p className="text-xs text-on-surface-variant">Keuntungan Bersih</p>
          <p className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)] mt-1">Rp 14.8M</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/20">
        <h3 className="font-bold text-sm text-on-surface mb-6 font-[family-name:var(--font-heading)]">Tren Pendapatan Bulanan (2026)</h3>
        <div className="flex items-end justify-between gap-3 h-[250px] border-b border-outline-variant/30 pb-2">
          {monthlyData.map(d => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-on-surface-variant">{formatRupiah(d.revenue).replace('Rp ', '')}</span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-primary to-pink-400 transition-all duration-500 hover:opacity-80 cursor-pointer min-h-[4px]"
                style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                title={`${d.month}: ${formatRupiah(d.revenue)}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-on-surface-variant font-semibold">
          {monthlyData.map(d => <span key={d.month}>{d.month}</span>)}
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/20">
        <h3 className="font-bold text-sm text-on-surface mb-4 font-[family-name:var(--font-heading)]">Kategori Terlaris</h3>
        <div className="space-y-4">
          {[
            { name: 'Top Up Game', pct: 45, color: 'bg-primary' },
            { name: 'Pulsa & Data', pct: 25, color: 'bg-secondary' },
            { name: 'App Premium', pct: 15, color: 'bg-tertiary' },
            { name: 'Token & Tagihan', pct: 10, color: 'bg-pink-500' },
            { name: 'SMM Panel', pct: 5, color: 'bg-amber-500' },
          ].map(cat => (
            <div key={cat.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-on-surface font-semibold">{cat.name}</span>
                <span className="text-on-surface-variant">{cat.pct}%</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2">
                <div className={`${cat.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${cat.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
