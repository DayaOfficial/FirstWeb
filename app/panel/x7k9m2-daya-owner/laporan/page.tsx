'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Inbox, Loader2 } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface OrderRow {
  amount: number;
  payment_status: string;
  process_status: string;
  created_at: string;
  buyer_phone: string | null;
  buyer_name: string | null;
}

export default function OwnerLaporanPage() {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<{ month: string; revenue: number; orders: number }[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [thisMonthRevenue, setThisMonthRevenue] = useState(0);
  const [lastMonthRevenue, setLastMonthRevenue] = useState(0);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('orders')
        .select('amount, payment_status, process_status, created_at, buyer_phone, buyer_name')
        .eq('payment_status', 'paid');

      const orders = (data as OrderRow[]) || [];

      // Total stats
      const rev = orders.reduce((s, o) => s + Number(o.amount || 0), 0);
      setTotalRevenue(rev);
      setTotalOrders(orders.length);
      setTotalCustomers(new Set(orders.map(o => o.buyer_phone || o.buyer_name).filter(Boolean)).size);

      // Monthly breakdown (last 7 months)
      const now = new Date();
      const months: { month: string; revenue: number; orders: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('id-ID', { month: 'short' });
        const monthOrders = orders.filter(o => o.created_at?.startsWith(key));
        months.push({
          month: label,
          revenue: monthOrders.reduce((s, o) => s + Number(o.amount || 0), 0),
          orders: monthOrders.length,
        });
      }
      setMonthlyData(months);

      // This vs last month comparison
      const thisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastKey = `${lastD.getFullYear()}-${String(lastD.getMonth() + 1).padStart(2, '0')}`;
      setThisMonthRevenue(orders.filter(o => o.created_at?.startsWith(thisKey)).reduce((s, o) => s + Number(o.amount || 0), 0));
      setLastMonthRevenue(orders.filter(o => o.created_at?.startsWith(lastKey)).reduce((s, o) => s + Number(o.amount || 0), 0));

      setLoading(false);
    };
    load();
  }, []);

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);
  const changePercent = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : '0';
  const isUp = thisMonthRevenue >= lastMonthRevenue;

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
            {!loading && (
              <span className={`flex items-center gap-1 text-[11px] font-semibold ${isUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-2 py-0.5 rounded-full`}>
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {isUp ? '+' : ''}{changePercent}%
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface-variant">Pendapatan Bulan Ini</p>
          <p className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)] mt-1">
            {loading ? '—' : formatRupiah(thisMonthRevenue)}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-soft border border-outline-variant/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-secondary/10 text-secondary rounded-lg"><ShoppingCart size={20} /></div>
          </div>
          <p className="text-xs text-on-surface-variant">Total Pesanan (Semua)</p>
          <p className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)] mt-1">{loading ? '—' : totalOrders}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-soft border border-outline-variant/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-tertiary/10 text-tertiary rounded-lg"><Users size={20} /></div>
          </div>
          <p className="text-xs text-on-surface-variant">Total Pelanggan</p>
          <p className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)] mt-1">{loading ? '—' : totalCustomers}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-soft border border-outline-variant/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg"><DollarSign size={20} /></div>
          </div>
          <p className="text-xs text-on-surface-variant">Total Pendapatan (Semua)</p>
          <p className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)] mt-1">{loading ? '—' : formatRupiah(totalRevenue)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-surface-container-lowest rounded-xl shadow-soft p-5 sm:p-6 border border-outline-variant/20">
        <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)] mb-6">Pendapatan 7 Bulan Terakhir</h3>
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
        ) : monthlyData.every(d => d.revenue === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
            <Inbox size={48} className="mb-4 opacity-20" />
            <p className="text-sm">Belum ada data pendapatan.</p>
          </div>
        ) : (
          <>
            <div className="flex items-end gap-3 sm:gap-4" style={{ height: '260px' }}>
              {monthlyData.map((d, i) => {
                const pct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={i} className="flex-1 relative group flex flex-col items-center justify-end h-full">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${i === monthlyData.length - 1 ? 'bg-primary shadow-[0_0_15px_rgba(192,0,58,0.3)]' : 'bg-primary-container/40 group-hover:bg-primary-container/60'}`}
                      style={{ height: `${Math.max(pct, 2)}%`, minWidth: '16px' }}
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {formatRupiah(d.revenue)} · {d.orders} pesanan
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 sm:gap-4 mt-3 border-t border-outline-variant pt-3">
              {monthlyData.map((d, i) => (
                <div key={i} className="flex-1 text-center text-xs text-on-surface-variant font-semibold">{d.month}</div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
