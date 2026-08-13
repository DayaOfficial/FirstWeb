'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Minus, Bot, Check, Trash2, Package } from 'lucide-react';

interface RobuxProduct {
  id: string;
  name: string;
  price_sell: number;
  stock: number;
  is_active: boolean;
}

export default function RobuxVilogPage() {
  const sb = createClient();
  const [rows, setRows] = useState<RobuxProduct[]>([]);
  const [form, setForm] = useState({ amount: '', price: '', stock: '' });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const { data } = await sb.from('products').select('*')
      .eq('module', 'manual_robux')
      .order('price_sell');
    setRows((data as RobuxProduct[]) || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!form.amount || !form.price) return alert('Jumlah Robux & harga wajib diisi');
    setAdding(true);
    await sb.from('products').insert({
      module: 'manual_robux',
      category: 'robux',
      name: `${form.amount} Robux`,
      price_sell: Number(form.price),
      price_modal: 0,
      stock: Number(form.stock || 0),
      is_active: true,
      manual_confirmation: true,
    });
    setForm({ amount: '', price: '', stock: '' });
    await load();
    setAdding(false);
  }

  async function patch(id: string, p: Partial<RobuxProduct>) {
    await sb.from('products').update(p).eq('id', id);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Hapus paket ini?')) return;
    await sb.from('products').delete().eq('id', id);
    load();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
          <Bot size={28} className="text-primary" /> Robux &amp; Vilog
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Kelola paket Robux via login secara manual. {rows.length} paket terdaftar.
        </p>
      </div>

      {/* Add form */}
      <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-soft p-5">
        <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
          <Plus size={16} className="text-primary" /> Tambah Paket Baru
        </h3>
        <div className="flex flex-wrap gap-3">
          <input
            placeholder="Jumlah Robux"
            type="number"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary transition-colors"
          />
          <input
            placeholder="Harga Jual (Rp)"
            type="number"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary transition-colors"
          />
          <input
            placeholder="Stok Awal"
            type="number"
            value={form.stock}
            onChange={e => setForm({ ...form, stock: e.target.value })}
            className="w-28 px-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={add}
            disabled={adding}
            className="px-5 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      {/* Product list */}
      {rows.length === 0 && (
        <div className="text-center py-16 text-on-surface-variant">
          <Package size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Belum ada paket Robux. Tambahkan paket pertama di atas.</p>
        </div>
      )}

      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-soft px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                R
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">{r.name}</p>
                <p className="text-xs text-on-surface-variant">
                  Rp {Number(r.price_sell).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Stock controls */}
              <div className="flex items-center gap-1.5 bg-surface-container-high rounded-xl px-2 py-1">
                <button
                  onClick={() => patch(r.id, { stock: Math.max(0, r.stock - 1) })}
                  className="w-7 h-7 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center hover:border-primary transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="text-sm font-bold text-on-surface min-w-[32px] text-center">{r.stock}</span>
                <button
                  onClick={() => patch(r.id, { stock: r.stock + 1 })}
                  className="w-7 h-7 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center hover:border-primary transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Active toggle */}
              <button
                onClick={() => patch(r.id, { is_active: !r.is_active })}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${r.is_active ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30 hover:border-green-300'}`}
              >
                {r.is_active && <Check size={14} />}
              </button>

              {/* Delete */}
              <button
                onClick={() => remove(r.id)}
                className="w-8 h-8 rounded-lg bg-red-50 text-red-500 border border-red-200 flex items-center justify-center hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
