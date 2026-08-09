'use client';

import { ShoppingCart, Search, Eye, Inbox, Loader2 } from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

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

const processColors: Record<string, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  waiting: 'bg-amber-50 text-amber-700 border-amber-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  canceled: 'bg-red-50 text-red-700 border-red-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

const processLabels: Record<string, string> = {
  success: 'Selesai',
  processing: 'Diproses',
  waiting: 'Menunggu',
  pending: 'Pending',
  canceled: 'Dibatalkan',
  failed: 'Gagal',
};

export default function OwnerPesananPage() {
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('orders')
        .select('id, order_code, product_name, module, amount, buyer_name, payment_status, process_status, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      setOrders((data as OrderRow[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = orders.filter(o =>
    (o.order_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.buyer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.product_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalOrders = orders.length;
  const successCount = orders.filter(o => o.process_status === 'success').length;
  const processingCount = orders.filter(o => ['processing', 'waiting', 'pending'].includes(o.process_status)).length;
  const canceledCount = orders.filter(o => ['canceled', 'failed'].includes(o.process_status)).length;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };

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
          <p className="text-2xl font-bold text-on-surface font-[family-name:var(--font-heading)]">{loading ? '—' : totalOrders}</p>
          <p className="text-xs text-on-surface-variant mt-1">Total Pesanan</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-soft border border-outline-variant/20 text-center">
          <p className="text-2xl font-bold text-green-600 font-[family-name:var(--font-heading)]">{loading ? '—' : successCount}</p>
          <p className="text-xs text-on-surface-variant mt-1">Selesai</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-soft border border-outline-variant/20 text-center">
          <p className="text-2xl font-bold text-blue-600 font-[family-name:var(--font-heading)]">{loading ? '—' : processingCount}</p>
          <p className="text-xs text-on-surface-variant mt-1">Diproses</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-soft border border-outline-variant/20 text-center">
          <p className="text-2xl font-bold text-red-600 font-[family-name:var(--font-heading)]">{loading ? '—' : canceledCount}</p>
          <p className="text-xs text-on-surface-variant mt-1">Dibatalkan</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-soft overflow-hidden border border-outline-variant/20">
        {loading ? (
          <div className="p-12 text-center"><Loader2 size={28} className="mx-auto animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox size={48} className="mx-auto mb-4 text-on-surface-variant/20" />
            <p className="text-sm font-semibold text-on-surface-variant">
              {search ? 'Tidak ada pesanan yang cocok.' : 'Belum ada transaksi. Pesanan pembeli akan muncul di sini.'}
            </p>
          </div>
        ) : (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {filtered.map(order => (
                  <tr key={order.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-5 text-sm font-mono font-semibold text-on-surface">{order.order_code}</td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full gradient-primary text-white flex items-center justify-center text-[10px] font-bold">
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
                      <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border', processColors[order.process_status] || '')}>
                        {processLabels[order.process_status] || order.process_status}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-xs text-on-surface-variant">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
