'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  RefreshCw, Image as ImgIcon, Search, ChevronDown, ChevronRight, Check,
  DollarSign, Save, CheckCircle2, Loader2, Upload, X
} from 'lucide-react';

const calcSell = (modal: number, type: string, val: number) =>
  type === 'percent' ? Math.round(modal * (1 + val / 100)) : modal + val;

/* Brand color mapping */
const BRAND_COLORS: Record<string, string> = {
  'TELKOMSEL': '#ED1C24', 'INDOSAT': '#FFDD00', 'XL': '#0068B7',
  'AXIS': '#6D2E8A', 'TRI': '#FF6600', 'SMARTFREN': '#F7941E',
  'BY.U': '#00AEEF', 'DANA': '#118EEA', 'OVO': '#4C3494',
  'GOPAY': '#00AAD2', 'GO PAY': '#00AAD2', 'SHOPEEPAY': '#EE4D2D',
  'SHOPEE PAY': '#EE4D2D', 'LINKAJA': '#E42313', 'PLN': '#1A73E8',
  'FREE FIRE': '#FF5722', 'MOBILE LEGENDS': '#2B5EA2',
};
function brandColor(b: string) { return BRAND_COLORS[b.toUpperCase()] || '#6366F1'; }
function brandInitials(b: string) { return b.slice(0, 2).toUpperCase(); }

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

  // Global markup
  const [markupType, setMarkupType] = useState<'percent' | 'nominal'>('percent');
  const [markupValue, setMarkupValue] = useState('15');
  const [markupSaving, setMarkupSaving] = useState(false);
  const [markupSaved, setMarkupSaved] = useState(false);

  // Brand image upload
  const [brandImageModal, setBrandImageModal] = useState<string | null>(null);
  const brandFileRef = useRef<HTMLInputElement>(null);
  const [uploadingBrand, setUploadingBrand] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb.from('products').select('*')
      .eq('module', 'digiflazz').in('category', categories)
      .order('brand').order('price_modal');
    setRows((data as Product[]) || []);
  }, [categories]);

  // Load global markup
  const loadMarkup = useCallback(async () => {
    const { data } = await sb.from('settings').select('key, value')
      .in('key', ['digiflazz_markup_percent', 'digiflazz_markup_type']);
    for (const r of data || []) {
      if (r.key === 'digiflazz_markup_percent') setMarkupValue(r.value || '15');
      if (r.key === 'digiflazz_markup_type') setMarkupType((r.value as 'percent' | 'nominal') || 'percent');
    }
  }, []);

  useEffect(() => { load(); loadMarkup(); }, [load, loadMarkup]);

  // Save global markup
  async function saveMarkup() {
    setMarkupSaving(true);
    await sb.from('settings').upsert([
      { key: 'digiflazz_markup_percent', value: markupValue },
      { key: 'digiflazz_markup_type', value: markupType },
    ], { onConflict: 'key' });
    setMarkupSaved(true);
    setTimeout(() => setMarkupSaved(false), 3000);
    setMarkupSaving(false);
  }

  // Save markup + sync all
  async function saveAndSync() {
    setBusy(true);
    setSyncResult(null);
    await saveMarkup();
    try {
      const res = await fetch('/api/owner/products/sync-digiflazz', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(`✅ ${data.synced} produk disinkronkan dengan markup ${markupType === 'percent' ? markupValue + '%' : 'Rp ' + Number(markupValue).toLocaleString('id-ID')}`);
      } else {
        setSyncResult(`❌ ${data.error}`);
      }
      await load();
    } catch {
      setSyncResult('❌ Gagal sinkronkan');
    }
    setBusy(false);
    setTimeout(() => setSyncResult(null), 6000);
  }

  // Apply markup to visible category only (without sync)
  async function applyMarkupLocal() {
    setMarkupSaving(true);
    await saveMarkup();
    const val = Number(markupValue);
    for (const r of rows) {
      const newSell = calcSell(r.price_modal, markupType, val);
      await sb.from('products').update({ price_sell: newSell, markup_type: markupType, markup_value: val }).eq('id', r.id);
    }
    await load();
    setMarkupSaved(true);
    setTimeout(() => setMarkupSaved(false), 3000);
    setMarkupSaving(false);
  }

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

  // Upload image per BRAND (applied to all products of that brand)
  async function onBrandImage(brand: string, file: File) {
    setUploadingBrand(brand);
    const path = `brands/${brand.toLowerCase().replace(/\s+/g, '-')}.webp`;
    await sb.storage.from('brand-logos').upload(path, file, { upsert: true });
    const url = sb.storage.from('brand-logos').getPublicUrl(path).data.publicUrl;
    // Apply to all products with this brand
    const brandRows = rows.filter(r => r.brand === brand);
    for (const r of brandRows) {
      await sb.from('products').update({ image_url: url }).eq('id', r.id);
    }
    setUploadingBrand(null);
    setBrandImageModal(null);
    await load();
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

      {/* ═══ GLOBAL MARKUP CARD ═══ */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 shadow-soft space-y-4">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <DollarSign size={16} className="text-primary" /> Atur Profit Markup Global
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          {/* Type toggle */}
          <div className="flex gap-2">
            <button onClick={() => setMarkupType('percent')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                markupType === 'percent' ? 'gradient-primary text-white border-transparent' : 'bg-surface-container-low text-on-surface-variant border-outline-variant'
              }`}>
              Persentase (%)
            </button>
            <button onClick={() => setMarkupType('nominal')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                markupType === 'nominal' ? 'gradient-primary text-white border-transparent' : 'bg-surface-container-low text-on-surface-variant border-outline-variant'
              }`}>
              Nominal (Rp)
            </button>
          </div>
          {/* Value input */}
          <div className="flex-1 max-w-[200px]">
            <input type="number" value={markupValue} onChange={e => setMarkupValue(e.target.value)} min={0}
              placeholder={markupType === 'percent' ? '15' : '3000'}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary transition-all" />
            <p className="text-[10px] text-on-surface-variant mt-1">
              {markupType === 'percent' ? `Jual = modal × (1 + ${markupValue || 0}%)` : `Jual = modal + Rp ${Number(markupValue || 0).toLocaleString('id-ID')}`}
            </p>
          </div>
          {/* Buttons */}
          <div className="flex gap-2">
            <button onClick={applyMarkupLocal} disabled={markupSaving}
              className="px-4 py-2 rounded-xl bg-accent-green/90 text-white text-xs font-semibold hover:bg-accent-green transition-all flex items-center gap-1.5 disabled:opacity-50">
              {markupSaved ? <><CheckCircle2 size={13} /> Tersimpan!</> : markupSaving ? <><Loader2 size={13} className="animate-spin" /> Menerapkan...</> : <><Save size={13} /> Terapkan</>}
            </button>
            <button onClick={saveAndSync} disabled={busy}
              className="px-4 py-2 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 disabled:opacity-50">
              {busy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Sync + Markup
            </button>
          </div>
        </div>
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
        const brandImg = brandRows[0]?.image_url;
        const color = brandColor(b);

        return (
          <div key={b} className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-soft overflow-hidden">
            <div className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-container-low transition-colors">
              <button
                onClick={() => toggleBrand(b)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                {isExpanded ? <ChevronDown size={18} className="text-primary" /> : <ChevronRight size={18} className="text-on-surface-variant" />}

                {/* Brand icon/image */}
                {brandImg ? (
                  <img src={brandImg} alt={b} className="w-9 h-9 rounded-xl object-cover border border-outline-variant/30" />
                ) : (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm"
                    style={{ backgroundColor: color }}>
                    {brandInitials(b)}
                  </div>
                )}

                <span className="font-bold text-on-surface">{b}</span>
                <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                  {brandRows.length} produk · {activeCount} aktif
                </span>
              </button>

              {/* Brand image upload button */}
              <button
                onClick={() => { setBrandImageModal(b); }}
                className="ml-2 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/30 text-xs font-medium text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center gap-1.5"
                title="Upload gambar brand"
              >
                <Upload size={12} />
                {brandImg ? 'Ganti' : 'Gambar'}
              </button>
            </div>

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
                        {r.image_url ? (
                          <img src={r.image_url} alt="" className="w-8 h-8 rounded-lg object-cover border border-outline-variant/30" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/30 flex items-center justify-center">
                            <ImgIcon size={12} className="text-on-surface-variant/40" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ═══ BRAND IMAGE UPLOAD MODAL ═══ */}
      {brandImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setBrandImageModal(null)}>
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-on-surface font-[family-name:var(--font-heading)]">
                Upload Gambar — {brandImageModal}
              </h3>
              <button onClick={() => setBrandImageModal(null)} className="p-1.5 rounded-full hover:bg-surface-container-high">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant mb-4">
              Gambar ini akan diterapkan ke <strong>semua produk</strong> dengan brand &quot;{brandImageModal}&quot;.
              <br />Format: JPG/PNG/WebP, maks 2MB.
            </p>

            {/* Current brand image */}
            <div className="flex items-center gap-3 mb-4">
              {rows.find(r => r.brand === brandImageModal)?.image_url ? (
                <img src={rows.find(r => r.brand === brandImageModal)!.image_url!} alt="" className="w-16 h-16 rounded-xl object-cover border" />
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: brandColor(brandImageModal) }}>
                  {brandInitials(brandImageModal)}
                </div>
              )}
              <span className="text-sm text-on-surface-variant">
                {rows.find(r => r.brand === brandImageModal)?.image_url ? 'Gambar saat ini' : 'Belum ada gambar'}
              </span>
            </div>

            <input ref={brandFileRef} type="file" accept="image/*" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (!f || !brandImageModal) return;
                if (f.size > 2 * 1024 * 1024) { alert('Maks 2MB'); return; }
                onBrandImage(brandImageModal, f);
              }}
            />

            <button
              onClick={() => brandFileRef.current?.click()}
              disabled={uploadingBrand === brandImageModal}
              className="w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {uploadingBrand === brandImageModal ? (
                <><Loader2 size={16} className="animate-spin" /> Mengupload...</>
              ) : (
                <><Upload size={16} /> Pilih Gambar</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
