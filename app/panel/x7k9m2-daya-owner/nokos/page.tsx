'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, Minus, Image as ImgIcon, ShieldCheck, Loader2, Upload } from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface NokosAppRow {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface NokosCountryRow {
  id: string;
  app_id: string;
  country_code: string;
  country_name: string;
  flag_emoji: string;
  flag_image_url: string | null;
  price: number;
  stock: number;
  description: string | null;
  is_active: boolean;
}

export default function NokosOwnerPage() {
  const supabase = createClient();
  const [apps, setApps] = useState<NokosAppRow[]>([]);
  const [countries, setCountries] = useState<Record<string, NokosCountryRow[]>>({});
  const [loading, setLoading] = useState(true);

  // App form
  const [showAppForm, setShowAppForm] = useState(false);
  const [appName, setAppName] = useState('');
  const [appDesc, setAppDesc] = useState('');
  const [appLogo, setAppLogo] = useState<File | null>(null);
  const [appLogoPreview, setAppLogoPreview] = useState('');
  const appLogoRef = useRef<HTMLInputElement>(null);

  // Country form
  const [countryForAppId, setCountryForAppId] = useState<string | null>(null);
  const [cName, setCName] = useState('');
  const [cFlag, setCFlag] = useState('');
  const [cFlagFile, setCFlagFile] = useState<File | null>(null);
  const [cPrice, setCPrice] = useState('');
  const [cStock, setCStock] = useState('0');
  const [cDesc, setCDesc] = useState('');
  const cFlagRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);

  async function uploadFile(file: File, folder: string): Promise<string> {
    const path = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    await supabase.storage.from('brand-logos').upload(path, file, { upsert: true });
    return supabase.storage.from('brand-logos').getPublicUrl(path).data.publicUrl;
  }

  async function loadAll() {
    const { data: appsData } = await supabase
      .from('nokos_apps')
      .select('*')
      .order('sort_order', { ascending: true });
    const appsList = (appsData as NokosAppRow[]) || [];
    setApps(appsList);

    const map: Record<string, NokosCountryRow[]> = {};
    for (const app of appsList) {
      const { data: cData } = await supabase
        .from('nokos_countries')
        .select('*')
        .eq('app_id', app.id)
        .order('country_name');
      map[app.id] = (cData as NokosCountryRow[]) || [];
    }
    setCountries(map);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  // ── TAMBAH APLIKASI ──
  async function saveApp() {
    if (!appName.trim()) return alert('Nama aplikasi wajib diisi');
    setSaving(true);
    let logo_url: string | null = null;
    if (appLogo) logo_url = await uploadFile(appLogo, 'nokos');
    await supabase.from('nokos_apps').insert({
      name: appName.trim(),
      logo_url,
      description: appDesc.trim() || null,
      is_active: true,
      sort_order: apps.length,
    });
    setAppName(''); setAppDesc(''); setAppLogo(null); setAppLogoPreview('');
    setShowAppForm(false);
    setSaving(false);
    loadAll();
  }

  // ── TAMBAH NEGARA ──
  async function saveCountry(appId: string) {
    if (!cName.trim() || !cPrice) return alert('Nama negara & harga wajib diisi');
    setSaving(true);
    let flag_image_url: string | null = null;
    if (cFlagFile) flag_image_url = await uploadFile(cFlagFile, 'flags');
    await supabase.from('nokos_countries').insert({
      app_id: appId,
      country_name: cName.trim(),
      country_code: cName.trim().substring(0, 2).toUpperCase(),
      flag_emoji: cFlag || '🏳️',
      flag_image_url,
      price: Number(cPrice),
      stock: Number(cStock || 0),
      description: cDesc.trim() || null,
      is_active: true,
    });
    setCName(''); setCFlag(''); setCFlagFile(null); setCPrice(''); setCStock('0'); setCDesc('');
    setCountryForAppId(null);
    setSaving(false);
    loadAll();
  }

  // ── STOK +/- ──
  async function adjustStock(id: string, delta: number, current: number) {
    const newStock = Math.max(0, current + delta);
    await supabase.from('nokos_countries').update({ stock: newStock }).eq('id', id);
    setCountries(prev => {
      const next = { ...prev };
      for (const appId in next) {
        next[appId] = next[appId].map(c => c.id === id ? { ...c, stock: newStock } : c);
      }
      return next;
    });
  }

  // ── HAPUS ──
  async function delCountry(id: string) {
    if (!confirm('Hapus negara ini?')) return;
    await supabase.from('nokos_countries').delete().eq('id', id);
    loadAll();
  }

  async function delApp(id: string) {
    if (!confirm('Hapus aplikasi beserta semua negaranya?')) return;
    await supabase.from('nokos_apps').delete().eq('id', id);
    loadAll();
  }

  // ── TOGGLE AKTIF ──
  async function toggleAppActive(app: NokosAppRow) {
    await supabase.from('nokos_apps').update({ is_active: !app.is_active }).eq('id', app.id);
    loadAll();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
            <ShieldCheck size={28} className="text-primary" /> Nokos
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">Kelola aplikasi & negara Nomor Kosong. Total: {apps.length} aplikasi</p>
        </div>
        <button onClick={() => setShowAppForm(v => !v)}
          className="px-5 py-2.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center gap-2">
          <Plus size={16} /> Tambah Aplikasi
        </button>
      </div>

      {/* ── FORM TAMBAH APLIKASI ── */}
      {showAppForm && (
        <div className="bg-surface-container-lowest rounded-2xl border border-primary/15 p-6 shadow-soft animate-fade-in space-y-4">
          <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">Tambah Aplikasi Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Nama Aplikasi *</label>
              <input type="text" value={appName} onChange={e => setAppName(e.target.value)}
                placeholder="Telegram, WhatsApp, dll"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Deskripsi</label>
              <input type="text" value={appDesc} onChange={e => setAppDesc(e.target.value)}
                placeholder="Nomor kosong untuk verifikasi"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Logo Aplikasi</label>
              <div className="flex items-center gap-3">
                <input ref={appLogoRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setAppLogo(f); const r = new FileReader(); r.onload = ev => setAppLogoPreview(ev.target?.result as string); r.readAsDataURL(f); }
                  }} />
                <button type="button" onClick={() => appLogoRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm cursor-pointer hover:border-primary transition-colors">
                  <Upload size={16} /> Pilih Logo
                </button>
                {appLogoPreview && <img src={appLogoPreview} alt="Preview" className="w-10 h-10 rounded-lg object-contain border" />}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAppForm(false)}
              className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface-variant font-semibold text-sm hover:bg-surface-container-high transition-colors">
              Batal
            </button>
            <button onClick={saveApp} disabled={saving}
              className="px-5 py-2.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Simpan Aplikasi
            </button>
          </div>
        </div>
      )}

      {/* ── LOADING ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      )}

      {/* ── DAFTAR APLIKASI + NEGARA ── */}
      {!loading && apps.map(app => (
        <div key={app.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-soft overflow-hidden">
          {/* App Header */}
          <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              {app.logo_url ? (
                <img src={app.logo_url} alt={app.name} className="w-12 h-12 rounded-xl object-contain bg-surface-container-high border border-outline-variant/20 p-1" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center">
                  <ImgIcon size={20} className="text-outline-variant" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-on-surface text-base">{app.name}</h3>
                {app.description && <p className="text-xs text-on-surface-variant mt-0.5">{app.description}</p>}
                <p className="text-xs text-on-surface-variant">{(countries[app.id] || []).length} negara</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleAppActive(app)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                  app.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
                {app.is_active ? '✅ Aktif' : '⏸ Nonaktif'}
              </button>
              <button onClick={() => setCountryForAppId(countryForAppId === app.id ? null : app.id)}
                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1 hover:bg-primary/20 transition-colors">
                <Plus size={14} /> Negara
              </button>
              <button onClick={() => delApp(app.id)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/5 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Form Tambah Negara (inline) */}
          {countryForAppId === app.id && (
            <div className="p-5 bg-surface-container-low/50 border-b border-outline-variant/20 space-y-3 animate-fade-in">
              <h4 className="text-sm font-bold text-on-surface">Tambah Negara untuk {app.name}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <input type="text" value={cName} onChange={e => setCName(e.target.value)}
                  placeholder="Nama negara (Indonesia)" 
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                <input type="text" value={cFlag} onChange={e => setCFlag(e.target.value)}
                  placeholder="Emoji bendera (🇮🇩)"
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                <input type="number" value={cPrice} onChange={e => setCPrice(e.target.value)}
                  placeholder="Harga (5000)"
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                <input type="number" value={cStock} onChange={e => setCStock(e.target.value)}
                  placeholder="Stok awal"
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                <input type="text" value={cDesc} onChange={e => setCDesc(e.target.value)}
                  placeholder="Deskripsi (opsional)"
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                <div className="flex items-center gap-2">
                  <input ref={cFlagRef} type="file" accept="image/*" className="hidden"
                    onChange={e => setCFlagFile(e.target.files?.[0] || null)} />
                  <button type="button" onClick={() => cFlagRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs hover:border-primary transition-colors">
                    <Upload size={14} /> Gambar Bendera
                  </button>
                  {cFlagFile && <span className="text-xs text-on-surface-variant truncate">{cFlagFile.name}</span>}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setCountryForAppId(null)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant text-xs font-semibold">
                  Batal
                </button>
                <button onClick={() => saveCountry(app.id)} disabled={saving}
                  className="px-4 py-2 rounded-full gradient-primary text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1">
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  Simpan Negara
                </button>
              </div>
            </div>
          )}

          {/* Daftar Negara */}
          <div className="divide-y divide-outline-variant/20">
            {(countries[app.id] || []).map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-container-low/50 transition-colors">
                <div className="flex items-center gap-3">
                  {c.flag_image_url ? (
                    <img src={c.flag_image_url} alt={c.country_name} className="w-8 h-5 object-cover rounded border" />
                  ) : (
                    <span className="text-xl">{c.flag_emoji || '🏳️'}</span>
                  )}
                  <div>
                    <span className="text-sm font-semibold text-on-surface">{c.country_name}</span>
                    {c.description && <p className="text-[10px] text-on-surface-variant">{c.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-primary">{formatRupiah(Number(c.price))}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => adjustStock(c.id, -1, c.stock)}
                      className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className={cn('text-sm font-bold min-w-[32px] text-center',
                      c.stock === 0 ? 'text-error' : c.stock <= 3 ? 'text-amber-500' : 'text-accent-green')}>
                      {c.stock}
                    </span>
                    <button onClick={() => adjustStock(c.id, +1, c.stock)}
                      className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-accent-green/10 hover:text-accent-green transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={() => delCountry(c.id)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/5 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {(countries[app.id] || []).length === 0 && (
              <div className="px-5 py-6 text-center text-on-surface-variant text-sm">
                Belum ada negara. Klik &quot;+ Negara&quot; untuk menambahkan.
              </div>
            )}
          </div>
        </div>
      ))}

      {!loading && apps.length === 0 && (
        <div className="text-center py-16 text-on-surface-variant">
          <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm font-semibold">Belum ada aplikasi nokos.</p>
          <p className="text-xs mt-1">Klik &quot;Tambah Aplikasi&quot; untuk memulai.</p>
        </div>
      )}
    </div>
  );
}
