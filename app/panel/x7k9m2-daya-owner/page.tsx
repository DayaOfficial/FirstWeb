'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ShoppingCart, Users, Banknote, DollarSign, Package, BarChart3, Gamepad2, Smartphone, Crown, Eye, MoreVertical, AlertTriangle, Wallet, Inbox } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface BalanceWarning {
  provider: string;
  balance: number;
  currency: string;
}

interface OrderRow {
  id: string;
  order_code: string;
  product_name: string;
  module: string;
  amount: number;
  buyer_name: string | null;
  payment_status: string;
  process_status: string;
  created_at: string;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProfit: number;
}

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const processLabels: Record<string, string> = {
  success: 'Selesai', processing: 'Diproses', waiting: 'Menunggu',
  pending: 'Pending', canceled: 'Dibatalkan', failed: 'Gagal',
};

const processColors: Record<string, string> = {
  success: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  processing: 'bg-primary-container/10 text-primary-container border-primary-container/20',
  waiting: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  canceled: 'bg-error/10 text-error border-error/20',
  failed: 'bg-error/10 text-error border-error/20',
};

export default function OwnerDashboard() {
  const [warnings, setWarnings] = useState<BalanceWarning[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProfit: 0 });
  const [chartData, setChartData] = useState<{ day: string; value: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      // Fetch balance warnings
      try {
        const res = await fetch('/api/owner/balance');
        if (res.ok) {
          const { balances } = await res.json();
          const lowBalances = (balances || []).filter((b: { balance: number; provider: string }) => {
            if (b.provider === 'digiflazz') return b.balance < 100000;
            if (b.provider === 'jokerpanel') return b.balance < 50;
            return false;
          });
          setWarnings(lowBalances);
        }
      } catch { /* ignore */ }

      // Fetch orders for stats
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_code, product_name, module, amount, buyer_name, buyer_phone, payment_status, process_status, created_at, price_modal:amount')
        .order('created_at', { ascending: false });

      const allOrders = orders || [];

      // Calculate stats
      const paidOrders = allOrders.filter(o => o.payment_status === 'paid');
      const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
      const totalOrders = allOrders.length;

      // Count unique buyers
      const uniqueBuyers = new Set(allOrders.map(o => o.buyer_phone || o.buyer_name).filter(Boolean));

      setStats({
        totalRevenue,
        totalOrders,
        totalCustomers: uniqueBuyers.size,
        totalProfit: 0, // Will calculate when profit system is integrated
      });

      // Recent 5 orders
      setRecentOrders(allOrders.slice(0, 5));

      // Chart: last 7 days
      const now = new Date();
      const days: { day: string; value: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().slice(0, 10);
        const dayOrders = paidOrders.filter(o => o.created_at?.startsWith(dayStr));
        const dayTotal = dayOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
        days.push({ day: DAY_LABELS[d.getDay()], value: dayTotal });
      }
      setChartData(days);
      setLoading(false);
    };
    load();
  }, []);

  const maxChart = Math.max(...chartData.map(d => d.value), 1);

  const statCards = [
    { icon: Banknote, label: 'Total Pendapatan', value: formatRupiah(stats.totalRevenue), color: 'bg-primary-container/10 text-primary-container' },
    { icon: ShoppingCart, label: 'Total Pesanan', value: String(stats.totalOrders), color: 'bg-secondary/10 text-secondary' },
    { icon: Users, label: 'Pelanggan', value: String(stats.totalCustomers), color: 'bg-tertiary/10 text-tertiary' },
    { icon: DollarSign, label: 'Keuntungan', value: formatRupiah(stats.totalProfit), color: 'bg-pink-500/10 text-pink-500' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Warning Banners — saldo menipis */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w) => (
            <div key={w.provider} className="flex items-center gap-3 p-4 rounded-xl bg-error/10 border border-error/20 animate-fade-in">
              <AlertTriangle size={20} className="text-error shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-error">
                  Saldo {w.provider === 'digiflazz' ? 'Digiflazz' : 'JokerPanel'} menipis!
                </p>
                <p className="text-xs text-error/80">
                  Sisa: {w.currency === 'IDR' ? formatRupiah(w.balance) : `$${w.balance}`} — segera lakukan deposit.
                </p>
              </div>
              <Link href="/panel/x7k9m2-daya-owner/saldo"
                className="shrink-0 px-3 py-1.5 rounded-full bg-error text-white text-xs font-semibold hover:bg-error/90 transition-colors">
                <Wallet size={12} className="inline mr-1" /> Cek Saldo
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)]">Dashboard</h2>
          <p className="text-sm text-on-surface-variant mt-1">Ringkasan performa bisnis dan pesanan terbaru Anda.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link href="/panel/x7k9m2-daya-owner/produk"
            className="px-5 py-2.5 rounded-full border border-pink-500 text-pink-500 font-semibold text-sm hover:bg-pink-500/5 transition-colors flex items-center justify-center gap-2 bg-surface-container-lowest">
            <Package size={16} /> Kelola Produk
          </Link>
          <Link href="/panel/x7k9m2-daya-owner/pesanan"
            className="px-5 py-2.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2">
            <BarChart3 size={16} /> Lihat Transaksi
          </Link>
        </div>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-surface-container-lowest rounded-xl p-5 shadow-soft hover:shadow-[0px_8px_30px_rgba(192,0,58,0.12)] transition-shadow relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/3 rounded-full group-hover:scale-150 transition-transform duration-500" />
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className={`p-2 rounded-lg ${s.color}`}><s.icon size={20} /></div>
            </div>
            <h3 className="text-xs text-on-surface-variant mb-1 relative z-10">{s.label}</h3>
            <p className="text-xl font-bold text-on-surface relative z-10 font-[family-name:var(--font-heading)]">
              {loading ? '—' : s.value}
            </p>
          </div>
        ))}
      </section>

      {/* Chart */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-soft p-4 sm:p-6 flex flex-col" style={{ minHeight: '320px' }}>
          <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)] mb-6">Tren Penjualan (7 Hari)</h3>
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">Memuat data...</div>
          ) : chartData.every(d => d.value === 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant">
              <BarChart3 size={40} className="mb-3 opacity-20" />
              <p className="text-sm">Belum ada data penjualan minggu ini.</p>
            </div>
          ) : (
            <>
              <div className="flex-1 flex items-end gap-[4%] mt-auto border-b border-outline-variant pb-2 relative" style={{ minHeight: '200px' }}>
                {chartData.map((d, i) => {
                  const pct = maxChart > 0 ? (d.value / maxChart) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 relative group flex flex-col items-center justify-end" style={{ height: '100%' }}>
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${i === chartData.length - 1 ? 'bg-primary shadow-[0_0_15px_rgba(192,0,58,0.3)]' : 'bg-primary-container/40'}`}
                        style={{ height: `${Math.max(pct, 2)}%`, minWidth: '8px', maxWidth: '48px' }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {formatRupiah(d.value)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-[4%] mt-2">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 text-center text-xs text-on-surface-variant font-semibold truncate">{d.day}</div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-surface-container-highest to-surface-container rounded-xl shadow-soft p-5 sm:p-6 flex flex-col" style={{ minHeight: '320px' }}>
          <h3 className="text-lg font-bold text-on-surface mb-6 font-[family-name:var(--font-heading)]">Ringkasan Modul</h3>
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-sm text-on-surface-variant">Memuat...</div>
          ) : (
            <div className="flex-1 space-y-5 overflow-y-auto pr-1">
              {[
                { icon: Gamepad2, label: 'Top Up Game', module: 'digiflazz', color: 'bg-secondary/10 text-secondary' },
                { icon: Smartphone, label: 'Pulsa & Data', module: 'pulsa', color: 'bg-tertiary/10 text-tertiary' },
                { icon: Crown, label: 'App Premium', module: 'manual_app', color: 'bg-amber-500/10 text-amber-500' },
              ].map((cat, i) => {
                const count = recentOrders.filter(o => o.module === cat.module).length;
                return (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center`}>
                        <cat.icon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{cat.label}</p>
                        <p className="text-xs text-on-surface-variant">{count} pesanan</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Recent Orders */}
      <section className="bg-surface-container-lowest rounded-xl shadow-soft overflow-hidden">
        <div className="p-5 border-b border-outline-variant flex justify-between items-center">
          <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">Pesanan Terbaru</h3>
          <Link href="/panel/x7k9m2-daya-owner/pesanan" className="text-primary font-semibold text-sm hover:underline">Lihat Semua</Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-on-surface-variant">Memuat pesanan...</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox size={48} className="mx-auto mb-4 text-on-surface-variant/20" />
            <p className="text-sm font-semibold text-on-surface-variant">Belum ada transaksi</p>
            <p className="text-xs text-on-surface-variant/70 mt-1">Pesanan pembeli akan muncul di sini.</p>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="block sm:hidden divide-y divide-outline-variant/50">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant font-mono">{order.order_code}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${processColors[order.process_status] || processColors.waiting}`}>
                      {processLabels[order.process_status] || order.process_status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full gradient-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {(order.buyer_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-on-surface truncate">{order.buyer_name || 'Guest'}</span>
                  </div>
                  <p className="text-sm text-on-surface">{order.product_name}</p>
                  <p className="text-sm font-bold text-primary">{formatRupiah(Number(order.amount))}</p>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-surface-container/50 border-b border-outline-variant">
                    <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Order ID</th>
                    <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Pelanggan</th>
                    <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Produk</th>
                    <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total</th>
                    <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-5 text-sm text-on-surface font-mono">{order.order_code}</td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full gradient-primary text-white flex items-center justify-center text-[10px] font-bold">
                            {(order.buyer_name || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-on-surface">{order.buyer_name || 'Guest'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span className="text-sm text-on-surface block">{order.product_name}</span>
                        <span className="text-[10px] text-on-surface-variant">{order.module}</span>
                      </td>
                      <td className="py-3 px-5 text-sm font-semibold text-on-surface">{formatRupiah(Number(order.amount))}</td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold border ${processColors[order.process_status] || processColors.waiting}`}>
                          {processLabels[order.process_status] || order.process_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
