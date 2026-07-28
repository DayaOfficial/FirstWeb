'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, ShoppingCart, Users, Banknote, DollarSign, Package, BarChart3, Gamepad2, Smartphone, Crown, Eye, MoreVertical } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

const stats = [
  { icon: Banknote, label: 'Total Pendapatan', value: 'Rp 45.2M', change: '+12.5%', up: true, color: 'bg-primary-container/10 text-primary-container' },
  { icon: ShoppingCart, label: 'Total Pesanan', value: '1,248', change: '+8.2%', up: true, color: 'bg-secondary/10 text-secondary' },
  { icon: Users, label: 'Pelanggan Baru', value: '342', change: '-2.4%', up: false, color: 'bg-tertiary/10 text-tertiary' },
  { icon: DollarSign, label: 'Keuntungan Bersih', value: 'Rp 12.8M', change: '+15.3%', up: true, color: 'bg-pink-500/10 text-pink-500' },
];

const chartData = [
  { day: 'Sen', value: 40 },
  { day: 'Sel', value: 60 },
  { day: 'Rab', value: 50 },
  { day: 'Kam', value: 90 },
  { day: 'Jum', value: 70 },
  { day: 'Sab', value: 85 },
  { day: 'Min', value: 100 },
];

const categories = [
  { icon: Gamepad2, label: 'Top Up Game', transactions: 450, pct: '45%', color: 'bg-secondary/10 text-secondary' },
  { icon: Smartphone, label: 'Pulsa & Data', transactions: 320, pct: '32%', color: 'bg-tertiary/10 text-tertiary' },
  { icon: Crown, label: 'App Premium', transactions: 150, pct: '15%', color: 'bg-amber-500/10 text-amber-500' },
];

const recentOrders = [
  { id: '#DM-8921', customer: 'Andi Nugroho', initials: 'AN', product: 'Mobile Legends 344 Diamonds', cat: 'Top Up Game', total: 85000, status: 'Diproses', statusColor: 'bg-primary-container/10 text-primary-container border-primary-container/20' },
  { id: '#DM-8920', customer: 'Siti Rahma', initials: 'SR', product: 'Netflix Premium 1 Bulan', cat: 'App Premium', total: 120000, status: 'Selesai', statusColor: 'bg-tertiary/10 text-tertiary border-tertiary/20' },
  { id: '#DM-8919', customer: 'Budi Wibowo', initials: 'BW', product: 'Pulsa Telkomsel 100rb', cat: 'Pulsa & Paket Data', total: 98500, status: 'Selesai', statusColor: 'bg-tertiary/10 text-tertiary border-tertiary/20' },
  { id: '#DM-8918', customer: 'Citra Ayu', initials: 'CA', product: 'Token PLN 50.000', cat: 'Token & Tagihan', total: 51000, status: 'Dibatalkan', statusColor: 'bg-error/10 text-error border-error/20' },
];

export default function OwnerDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)]">Dashboard</h2>
          <p className="text-sm text-on-surface-variant mt-1">Ringkasan performa bisnis dan pesanan terbaru Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 rounded-full border border-pink-500 text-pink-500 font-semibold text-sm hover:bg-pink-500/5 transition-colors flex items-center gap-2 bg-surface-container-lowest">
            <Package size={16} /> Kelola Produk
          </button>
          <button className="px-5 py-2.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center gap-2">
            <BarChart3 size={16} /> Lihat Laporan
          </button>
        </div>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-surface-container-lowest rounded-xl p-5 shadow-soft hover:shadow-[0px_8px_30px_rgba(192,0,58,0.12)] transition-shadow relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/3 rounded-full group-hover:scale-150 transition-transform duration-500" />
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className={`p-2 rounded-lg ${s.color}`}>
                <s.icon size={20} />
              </div>
              <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${s.up ? 'text-tertiary bg-tertiary/10' : 'text-error bg-error/10'}`}>
                {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {s.change}
              </span>
            </div>
            <h3 className="text-xs text-on-surface-variant mb-1 relative z-10">{s.label}</h3>
            <p className="text-xl font-bold text-on-surface relative z-10 font-[family-name:var(--font-heading)]">{s.value}</p>
          </div>
        ))}
      </section>

      {/* Chart + Category */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-soft p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">Tren Penjualan (7 Hari)</h3>
            <select className="bg-surface border border-outline-variant text-sm rounded-lg p-2 text-on-surface-variant focus:ring-primary focus:border-primary">
              <option>7 Hari Terakhir</option>
              <option>Bulan Ini</option>
              <option>Tahun Ini</option>
            </select>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 mt-auto border-b border-outline-variant pb-2 relative">
            {chartData.map((d, i) => (
              <div key={i} className="w-full relative group" style={{ height: `${d.value}%` }}>
                <div className={`w-full h-full rounded-t-sm transition-all duration-500 ${i === chartData.length - 1 ? 'bg-primary shadow-[0_0_15px_rgba(192,0,58,0.3)]' : `bg-primary-container/${Math.min(20 + d.value * 0.6, 80)}`}`} />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {d.value * 0.2}M
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-on-surface-variant font-semibold">
            {chartData.map((d, i) => <span key={i}>{d.day}</span>)}
          </div>
        </div>

        {/* Category Highlights */}
        <div className="bg-gradient-to-br from-surface-container-highest to-surface-container rounded-xl shadow-soft p-6 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-on-surface mb-6 font-[family-name:var(--font-heading)]">Sorotan Kategori</h3>
          <div className="flex-1 space-y-5 overflow-y-auto pr-1">
            {categories.map((cat, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center`}>
                    <cat.icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{cat.label}</p>
                    <p className="text-xs text-on-surface-variant">{cat.transactions} transaksi</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-on-surface">{cat.pct}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-4 border-t border-outline-variant">
            <a href="#" className="text-primary font-semibold text-sm flex items-center justify-center gap-1 hover:underline">
              Lihat Semua Kategori →
            </a>
          </div>
        </div>
      </section>

      {/* Recent Orders */}
      <section className="bg-surface-container-lowest rounded-xl shadow-soft overflow-hidden">
        <div className="p-5 border-b border-outline-variant flex justify-between items-center">
          <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">Pesanan Terbaru</h3>
          <button className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"><MoreVertical size={18} /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container/50 border-b border-outline-variant">
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Order ID</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Pelanggan</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Produk</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {recentOrders.map((order, i) => (
                <tr key={i} className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                  <td className="py-3 px-5 text-sm text-on-surface">{order.id}</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full gradient-primary text-white flex items-center justify-center text-[10px] font-bold">{order.initials}</div>
                      <span className="text-sm text-on-surface">{order.customer}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <span className="text-sm text-on-surface block">{order.product}</span>
                    <span className="text-[10px] text-on-surface-variant">{order.cat}</span>
                  </td>
                  <td className="py-3 px-5 text-sm font-semibold text-on-surface">{formatRupiah(order.total)}</td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold border ${order.statusColor}`}>{order.status}</span>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <button className="text-on-surface-variant hover:text-primary transition-colors"><Eye size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-center">
          <a href="#" className="text-primary font-semibold text-sm hover:underline">Lihat Semua Pesanan</a>
        </div>
      </section>
    </div>
  );
}
