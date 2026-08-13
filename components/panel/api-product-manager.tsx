'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RefreshCw, Image as ImgIcon, Search, ChevronDown, ChevronRight, Check } from 'lucide-react';

const calcSell = (modal: number, type: string, val: number) =>
  type === 'percent' ? Math.round(modal * (1 + val / 100)) : modal + val;

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price_modal: number;
  price_sell: number;
  markup_type: string;
  markup_value: number;
  is_active: boolean;
  image_url: string | null;
  buyer_sku_code: string;
}

export function ApiProductManager({ categories, title }: { categories: string[]; title: string }) {
  const sb = createClient();
  const [rows, setRows] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb.from('products').select('*')
      .eq('module', 'digiflazz').in('category', categories)
      .order('brand').order('price_modal');
    setRows((data as Product[]) || []);
  }, [categories]);

  useEffect(() => { load(); }, [load]);

  async function sync() {
    setBusy(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/owner/products/sync-digiflazz', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(`✅ ${data.synced} produk disinkronkan`);
      } else {
        setSyncResult(`❌ ${data.error}`);
      }
      await load();
    } catch {
      setSyncResult('❌ Gagal sinkronkan');
    }
    setBusy(false);
    setTimeout(() => setSyncResult(null), 4000);
  }

  async function patch(id: string, p: Partial<Product>) {
    await sb.from('products').update(p).eq('id', id);
    load();
  }

  async function onMarkup(r: Product, type: string, val: number) {
    await patch(r.id, {
      markup_type: type,
      markup_value: val,
      price_sell: calcSell(r.price_modal, type, val),
    });
  }

  async function onImage(r: Product, file: File) {
    const path = `products/${r.id}.webp`;
    await sb.storage.from('brand-logos').upload(path, file, { upsert: true });
    const url = sb.storage.from('brand-logos').getPublicUrl(path).data.publicUrl;
    await patch(r.id, { image_url: url });
  }

  function toggleBrand(brand: string) {
    setExpandedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand); else next.add(brand);
      return next;
    });
  }

  const filtered = rows.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.brand.toLowerCase().includes(search.toLowerCase())
  );
  const brands = Array.from(new Set(filtered.map(r => r.brand)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)]">
            {title}
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {rows.length} produk · {rows.filter(r => r.is_active).length} aktif
          </p>
        </div>
        <button onClick={sync} disabled={busy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-50">
          <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />
          {busy ? 'Menyinkronkan...' : 'Sinkronkan Digiflazz'}
        </button>
      </div>

      {syncResult && (
        <div className={`text-sm px-4 py-2.5 rounded-xl animate-fade-in ${syncResult.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {syncResult}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari produk atau brand..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
      </div>

      {/* Product list by brand */}
      {brands.length === 0 && (
        <div className="text-center py-16 text-on-surface-variant">
          <p className="text-sm">Belum ada produk. Klik &quot;Sinkronkan Digiflazz&quot; untuk menarik data.</p>
        </div>
      )}

      {brands.map(b => {
        const brandRows = filtered.filter(r => r.brand === b);
        const activeCount = brandRows.filter(r => r.is_active).length;
        const isExpanded = expandedBrands.has(b);

        return (
          <div key={b} className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-soft overflow-hidden">
            <button
              onClick={() => toggleBrand(b)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown size={18} className="text-primary" /> : <ChevronRight size={18} className="text-on-surface-variant" />}
                <span className="font-bold text-on-surface">{b}</span>
                <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                  {brandRows.length} produk · {activeCount} aktif
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-outline-variant/20">
                <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-2 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider bg-surface-container-high/50">
                  <span className="col-span-4">Produk</span>
                  <span className="col-span-2">Modal</span>
                  <span className="col-span-2">Markup</span>
                  <span className="col-span-2">Harga Jual</span>
                  <span className="col-span-1 text-center">Aktif</span>
                  <span className="col-span-1 text-center">Gambar</span>
                </div>

                <div className="divide-y divide-outline-variant/10">
                  {brandRows.map(r => (
                    <div key={r.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center px-5 py-3 hover:bg-surface-container-low/50 transition-colors">
                      <span className="sm:col-span-4 text-sm text-on-surface font-medium truncate">{r.name}</span>
                      <span className="sm:col-span-2 text-sm text-on-surface-variant font-mono">
                        Rp {Number(r.price_modal).toLocaleString('id-ID')}
                      </span>
                      <div className="sm:col-span-2 flex items-center gap-1">
                        <input
                          type="number"
                          defaultValue={r.markup_value}
                          onBlur={e => onMarkup(r, r.markup_type || 'nominal', Number(e.target.value))}
                          className="w-20 px-2 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <span className="sm:col-span-2 text-sm font-bold text-primary font-mono">
                        Rp {Number(r.price_sell).toLocaleString('id-ID')}
                      </span>
                      <div className="sm:col-span-1 flex justify-center">
                        <button
                          onClick={() => patch(r.id, { is_active: !r.is_active })}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${r.is_active ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30 hover:border-green-300'}`}
                        >
                          {r.is_active && <Check size={14} />}
                        </button>
                      </div>
                      <div className="sm:col-span-1 flex justify-center">
                        <label className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/30 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                          <ImgIcon size={14} className="text-on-surface-variant" />
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => e.target.files && onImage(r, e.target.files[0])} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
