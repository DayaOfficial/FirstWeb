'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Minus, Crown, Check, Trash2, Package, ChevronDown, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { ImagePicker } from '@/components/ui/ImagePicker';

interface AppProduct {
  id: string;
  name: string;
  brand: string;
  is_active: boolean;
  image_url: string | null;
}

interface Plan {
  id: string;
  product_id: string;
  plan_name: string;
  price: number;
  stock: number;
  is_active: boolean;
}

const APP_CATEGORIES = ['Streaming', 'Musik', 'Editing', 'Edukasi', 'Produktivitas', 'VPN', 'Desain', 'Cloud'];
const PLAN_OPTIONS = ['1U', '2U', '5U', '8U', 'Semi', 'Sharing', 'Private', '1 Bulan', '3 Bulan', '6 Bulan', '1 Tahun'];

export default function AppPremiumOwnerPage() {
  const sb = createClient();
  const [apps, setApps] = useState<AppProduct[]>([]);
  const [plans, setPlans] = useState<Record<string, Plan[]>>({});
  const [appForm, setAppForm] = useState({ name: '', category: 'Streaming', image_url: '' });
  const [planFor, setPlanFor] = useState<string | null>(null);
  const [pForm, setPForm] = useState({ plan: '1U', price: '', stock: '' });
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const { data: a, error: aErr } = await sb.from('products').select('*')
        .eq('module', 'manual_app')
        .order('brand').order('name');

      if (aErr) {
        console.error('[app-premium] load error:', aErr.message);
        setLoadError(aErr.message);
        return;
      }

      const appList = Array.isArray(a) ? (a as AppProduct[]) : [];
      setApps(appList);

      const m: Record<string, Plan[]> = {};
      for (const app of appList) {
        const { data: p } = await sb.from('product_plans').select('*')
          .eq('product_id', app.id)
          .order('price');
        m[app.id] = Array.isArray(p) ? (p as Plan[]) : [];
      }
      setPlans(m);
    } catch (err: any) {
      console.error('[app-premium] unexpected:', err);
      setLoadError(err?.message || 'Terjadi kesalahan');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addApp() {
    if (!appForm.name) return alert('Nama aplikasi wajib diisi');
    setAdding(true);
    const { error } = await sb.from('products').insert({
      module: 'manual_app',
      category: 'app_premium',
      name: appForm.name,
      brand: appForm.category,
      image_url: appForm.image_url || null,
      is_active: true,
      price_sell: 0,
      price_modal: 0,
      manual_confirmation: true,
    });
    if (error) {
      alert('Gagal menambah aplikasi: ' + error.message);
    } else {
      setAppForm({ name: '', category: 'Streaming', image_url: '' });
      await load();
    }
    setAdding(false);
  }

  async function delApp(id: string) {
    if (!confirm('Hapus aplikasi ini beserta semua plan-nya?')) return;
    const { error } = await sb.from('products').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      load();
    }
  }

  async function addPlan(appId: string) {
    if (!pForm.price) return alert('Harga wajib diisi');
    await sb.from('product_plans').insert({
      product_id: appId,
      plan_name: pForm.plan,
      price: Number(pForm.price),
      stock: Number(pForm.stock || 0),
    });
    setPForm({ plan: '1U', price: '', stock: '' });
    setPlanFor(null);
    load();
  }

  async function patchPlan(id: string, p: Partial<Plan>) {
    await sb.from('product_plans').update(p).eq('id', id);
    load();
  }

  async function removePlan(id: string) {
    if (!confirm('Hapus plan ini?')) return;
    await sb.from('product_plans').delete().eq('id', id);
    load();
  }

  async function patchApp(id: string, p: Partial<AppProduct>) {
    await sb.from('products').update(p).eq('id', id);
    load();
  }

  function toggleApp(id: string) {
    setExpandedApps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Group apps by category
  const categories = Array.from(new Set(apps.map(a => a.brand)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
          <Crown size={28} className="text-primary" /> Aplikasi Premium
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Kelola produk aplikasi premium (Netflix, Spotify, YouTube, dll). {apps.length} aplikasi terdaftar.
        </p>
      </div>

      {/* Load Error */}
      {loadError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 animate-fade-in">
          ❌ Gagal memuat data: {loadError}
        </div>
      )}

      {/* Add App form */}
      <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-soft p-5">
        <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
          <Plus size={16} className="text-primary" /> Tambah Aplikasi Baru
        </h3>
        <div className="flex flex-wrap gap-3 items-end">
          {/* Image picker for new app */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[11px] text-on-surface-variant font-medium">Logo</span>
            <ImagePicker
              current={appForm.image_url || null}
              onSaved={url => setAppForm({ ...appForm, image_url: url })}
              size={44}
            />
          </div>
          <input
            placeholder="Nama aplikasi (contoh: Netflix)"
            value={appForm.name}
            onChange={e => setAppForm({ ...appForm, name: e.target.value })}
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary transition-colors"
          />
          <select
            value={appForm.category}
            onChange={e => setAppForm({ ...appForm, category: e.target.value })}
            className="px-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary transition-colors"
          >
            {APP_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <button
            onClick={addApp}
            disabled={adding}
            className="px-5 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      {/* App list */}
      {apps.length === 0 && !loadError && (
        <div className="text-center py-16 text-on-surface-variant">
          <Package size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Belum ada aplikasi. Tambahkan aplikasi pertama di atas.</p>
        </div>
      )}

      {categories.map(cat => (
        <div key={cat}>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-1">{cat}</h3>
          <div className="space-y-3">
            {apps.filter(a => a.brand === cat).map(app => {
              const appPlans = plans[app.id] || [];
              const isExpanded = expandedApps.has(app.id);

              return (
                <div key={app.id} className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-soft overflow-hidden">
                  {/* App header */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <button onClick={() => toggleApp(app.id)} className="flex items-center gap-3 flex-1 min-w-0">
                      {isExpanded ? <ChevronDown size={18} className="text-primary shrink-0" /> : <ChevronRight size={18} className="text-on-surface-variant shrink-0" />}
                      {/* App image */}
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-surface-container-high border border-outline-variant/20 flex items-center justify-center shrink-0">
                        {app.image_url ? (
                          <img src={app.image_url} alt={app.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={16} className="text-outline-variant" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-on-surface">{app.name}</span>
                        <span className="text-xs text-on-surface-variant ml-2">
                          {appPlans.length} plan
                        </span>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Change image */}
                      <ImagePicker
                        current={app.image_url}
                        size={32}
                        onSaved={url => {
                          sb.from('products').update({ image_url: url }).eq('id', app.id).then(() => load());
                        }}
                      />
                      {/* Add plan */}
                      <button
                        onClick={() => setPlanFor(planFor === app.id ? null : app.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface border border-outline-variant/30 hover:border-primary transition-colors flex items-center gap-1"
                      >
                        <Plus size={12} /> Plan
                      </button>
                      {/* Toggle active */}
                      <button
                        onClick={() => patchApp(app.id, { is_active: !app.is_active })}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${app.is_active ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30'}`}
                      >
                        {app.is_active && <Check size={14} />}
                      </button>
                      {/* Delete app */}
                      <button
                        onClick={() => delApp(app.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors"
                        title="Hapus aplikasi"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Add plan form */}
                  {planFor === app.id && (
                    <div className="px-5 pb-3 flex flex-wrap gap-2 animate-fade-in">
                      <select
                        value={pForm.plan}
                        onChange={e => setPForm({ ...pForm, plan: e.target.value })}
                        className="px-3 py-2 rounded-lg bg-surface-container-high border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary"
                      >
                        {PLAN_OPTIONS.map(p => <option key={p}>{p}</option>)}
                      </select>
                      <input
                        placeholder="Harga (Rp)"
                        type="number"
                        value={pForm.price}
                        onChange={e => setPForm({ ...pForm, price: e.target.value })}
                        className="w-32 px-3 py-2 rounded-lg bg-surface-container-high border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary"
                      />
                      <input
                        placeholder="Stok"
                        type="number"
                        value={pForm.stock}
                        onChange={e => setPForm({ ...pForm, stock: e.target.value })}
                        className="w-24 px-3 py-2 rounded-lg bg-surface-container-high border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => addPlan(app.id)}
                        className="px-4 py-2 rounded-lg gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-all"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setPlanFor(null)}
                        className="px-3 py-2 rounded-lg border border-outline-variant text-sm text-on-surface-variant hover:text-error hover:border-error transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  )}

                  {/* Plans list */}
                  {isExpanded && appPlans.length > 0 && (
                    <div className="border-t border-outline-variant/20 divide-y divide-outline-variant/10">
                      {appPlans.map(p => (
                        <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-container-low/50 transition-colors">
                          <div>
                            <span className="text-sm font-semibold text-on-surface">{p.plan_name}</span>
                            <span className="text-sm text-primary font-bold ml-3">
                              Rp {Number(p.price).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Stock controls */}
                            <div className="flex items-center gap-1 bg-surface-container-high rounded-lg px-1.5 py-0.5">
                              <button
                                onClick={() => patchPlan(p.id, { stock: Math.max(0, p.stock - 1) })}
                                className="w-6 h-6 rounded bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center hover:border-primary transition-colors"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="text-xs font-bold text-on-surface min-w-[24px] text-center">{p.stock}</span>
                              <button
                                onClick={() => patchPlan(p.id, { stock: p.stock + 1 })}
                                className="w-6 h-6 rounded bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center hover:border-primary transition-colors"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                            <button
                              onClick={() => removePlan(p.id)}
                              className="w-7 h-7 rounded-lg bg-red-50 text-red-500 border border-red-200 flex items-center justify-center hover:bg-red-100 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isExpanded && appPlans.length === 0 && (
                    <div className="border-t border-outline-variant/20 px-5 py-6 text-center text-xs text-on-surface-variant">
                      Belum ada plan. Klik &quot;+ Plan&quot; untuk menambahkan.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
