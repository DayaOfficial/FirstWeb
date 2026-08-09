'use client';

import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Plus, Edit3, Trash2, ChevronDown, ChevronUp, Upload, X, Minus, Loader2 } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { NokosApp, NokosCountry } from '@/types';

const COUNTRY_OPTIONS = [
  { code: 'ID', name: 'Indonesia', emoji: '🇮🇩' },
  { code: 'US', name: 'Amerika', emoji: '🇺🇸' },
  { code: 'GB', name: 'Inggris', emoji: '🇬🇧' },
  { code: 'MY', name: 'Malaysia', emoji: '🇲🇾' },
  { code: 'SG', name: 'Singapura', emoji: '🇸🇬' },
  { code: 'JP', name: 'Jepang', emoji: '🇯🇵' },
  { code: 'IN', name: 'India', emoji: '🇮🇳' },
  { code: 'BR', name: 'Brazil', emoji: '🇧🇷' },
  { code: 'DE', name: 'Jerman', emoji: '🇩🇪' },
  { code: 'AU', name: 'Australia', emoji: '🇦🇺' },
  { code: 'KR', name: 'Korea Selatan', emoji: '🇰🇷' },
  { code: 'TH', name: 'Thailand', emoji: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', emoji: '🇻🇳' },
  { code: 'PH', name: 'Filipina', emoji: '🇵🇭' },
  { code: 'RU', name: 'Rusia', emoji: '🇷🇺' },
  { code: 'FR', name: 'Prancis', emoji: '🇫🇷' },
  { code: 'CA', name: 'Kanada', emoji: '🇨🇦' },
  { code: 'MX', name: 'Meksiko', emoji: '🇲🇽' },
  { code: 'TR', name: 'Turki', emoji: '🇹🇷' },
  { code: 'SA', name: 'Arab Saudi', emoji: '🇸🇦' },
];

export default function OwnerNokosPage() {
  const [apps, setApps] = useState<NokosApp[]>([]);
  const [countries, setCountries] = useState<NokosCountry[]>([]);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAppModal, setShowAppModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'app' | 'country'; id: string } | null>(null);

  const [editingApp, setEditingApp] = useState<NokosApp | null>(null);
  const [editingCountry, setEditingCountry] = useState<NokosCountry | null>(null);
  const [stockTarget, setStockTarget] = useState<NokosCountry | null>(null);
  const [stockAction, setStockAction] = useState<'add' | 'subtract'>('add');
  const [stockAmount, setStockAmount] = useState(1);

  const [appName, setAppName] = useState('');
  const [appLogo, setAppLogo] = useState('');
  const [appDesc, setAppDesc] = useState('');
  const [appActive, setAppActive] = useState(true);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [countryForAppId, setCountryForAppId] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [countryPrice, setCountryPrice] = useState(0);
  const [countryStock, setCountryStock] = useState(0);
  const [countryDesc, setCountryDesc] = useState('');
  const [countryActive, setCountryActive] = useState(true);

  // Load from Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: appsData } = await supabase.from('nokos_apps').select('*').order('sort_order');
    const { data: countriesData } = await supabase.from('nokos_countries').select('*').order('country_name');
    if (appsData) setApps(appsData.map((a: Record<string, unknown>) => ({
      id: a.id as string, name: a.name as string, logoUrl: (a.logo_url as string) || '',
      description: (a.description as string) || '', isActive: a.is_active as boolean, sortOrder: (a.sort_order as number) || 0
    })));
    if (countriesData) setCountries(countriesData.map((c: Record<string, unknown>) => ({
      id: c.id as string, appId: c.app_id as string, countryCode: c.country_code as string,
      countryName: c.country_name as string, flagEmoji: (c.flag_emoji as string) || '',
      price: Number(c.price), stock: c.stock as number, description: (c.description as string) || '',
      isActive: c.is_active as boolean
    })));
    setLoading(false);
  };

  /* ── App CRUD ── */
  const openAddApp = () => {
    setEditingApp(null);
    setAppName(''); setAppLogo(''); setAppDesc(''); setAppActive(true);
    setShowAppModal(true);
  };

  const openEditApp = (app: NokosApp) => {
    setEditingApp(app);
    setAppName(app.name); setAppLogo(app.logoUrl); setAppDesc(app.description || ''); setAppActive(app.isActive);
    setShowAppModal(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Ukuran file maksimal 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setAppLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveApp = async () => {
    if (!appName.trim()) return;
    setSaving(true);
    const supabase = createClient();
    if (editingApp) {
      await supabase.from('nokos_apps').update({
        name: appName.trim(), logo_url: appLogo, description: appDesc.trim(), is_active: appActive
      }).eq('id', editingApp.id);
    } else {
      await supabase.from('nokos_apps').insert({
        name: appName.trim(), logo_url: appLogo, description: appDesc.trim(),
        is_active: appActive, sort_order: apps.length
      });
    }
    await loadData();
    setSaving(false);
    setShowAppModal(false);
  };

  const deleteApp = async (appId: string) => {
    const supabase = createClient();
    await supabase.from('nokos_countries').delete().eq('app_id', appId);
    await supabase.from('nokos_apps').delete().eq('id', appId);
    await loadData();
    setShowDeleteConfirm(null);
  };

  /* ── Country CRUD ── */
  const openAddCountry = (appId: string) => {
    setEditingCountry(null);
    setCountryForAppId(appId);
    setCountryCode(''); setCountryPrice(5000); setCountryStock(10); setCountryDesc(''); setCountryActive(true);
    setShowCountryModal(true);
  };

  const openEditCountry = (country: NokosCountry) => {
    setEditingCountry(country);
    setCountryForAppId(country.appId);
    setCountryCode(country.countryCode); setCountryPrice(country.price); setCountryStock(country.stock);
    setCountryDesc(country.description || ''); setCountryActive(country.isActive);
    setShowCountryModal(true);
  };

  const saveCountry = async () => {
    if (!countryCode) return;
    const opt = COUNTRY_OPTIONS.find(c => c.code === countryCode);
    if (!opt) return;
    setSaving(true);
    const supabase = createClient();
    if (editingCountry) {
      await supabase.from('nokos_countries').update({
        country_code: countryCode, country_name: opt.name, flag_emoji: opt.emoji,
        price: countryPrice, stock: countryStock, description: countryDesc.trim(), is_active: countryActive
      }).eq('id', editingCountry.id);
    } else {
      await supabase.from('nokos_countries').insert({
        app_id: countryForAppId, country_code: countryCode, country_name: opt.name,
        flag_emoji: opt.emoji, price: countryPrice, stock: countryStock,
        description: countryDesc.trim(), is_active: countryActive
      });
    }
    await loadData();
    setSaving(false);
    setShowCountryModal(false);
  };

  const deleteCountry = async (countryId: string) => {
    const supabase = createClient();
    await supabase.from('nokos_countries').delete().eq('id', countryId);
    await loadData();
    setShowDeleteConfirm(null);
  };

  /* ── Stock ── */
  const openStockModal = (country: NokosCountry, action: 'add' | 'subtract') => {
    setStockTarget(country); setStockAction(action); setStockAmount(1); setShowStockModal(true);
  };

  const handleStock = async () => {
    if (!stockTarget) return;
    setSaving(true);
    const supabase = createClient();
    const newStock = stockAction === 'add' ? stockTarget.stock + stockAmount : Math.max(0, stockTarget.stock - stockAmount);
    await supabase.from('nokos_countries').update({ stock: newStock }).eq('id', stockTarget.id);
    await loadData();
    setSaving(false);
    setShowStockModal(false);
  };

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface font-[family-name:var(--font-heading)] flex items-center gap-2">
            <ShieldCheck size={24} className="text-primary" /> Kelola Nokos
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">Atur aplikasi dan negara untuk nomor kosong. Data tersimpan di Supabase.</p>
        </div>
        <button onClick={openAddApp}
          className="px-5 py-2.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center gap-2 self-start">
          <Plus size={16} /> Tambah Aplikasi
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : apps.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
          <ShieldCheck size={48} className="mx-auto mb-4 text-on-surface-variant/30" />
          <p className="text-sm text-on-surface-variant">Belum ada aplikasi. Klik "Tambah Aplikasi" untuk mulai.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map(app => {
            const appCs = countries.filter(c => c.appId === app.id);
            const isExpanded = expandedApp === app.id;
            return (
              <div key={app.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-soft overflow-hidden">
                <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-container-low transition-colors"
                  onClick={() => setExpandedApp(isExpanded ? null : app.id)}>
                  {app.logoUrl ? (
                    <img src={app.logoUrl} alt={app.name} className={`w-10 h-10 rounded-[10px] object-cover ${!app.isActive ? 'grayscale opacity-50' : ''}`} />
                  ) : (
                    <div className={`w-10 h-10 rounded-[10px] gradient-primary flex items-center justify-center text-white font-bold text-lg ${!app.isActive ? 'grayscale opacity-50' : ''}`}>
                      {getInitials(app.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-on-surface">{app.name}</h3>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${app.isActive ? 'bg-accent-green/10 text-accent-green' : 'bg-gray-100 text-gray-500'}`}>
                        {app.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{appCs.length} negara</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEditApp(app)} className="p-2 rounded-lg hover:bg-primary/5 text-on-surface-variant hover:text-primary transition-colors"><Edit3 size={16} /></button>
                    <button onClick={() => setShowDeleteConfirm({ type: 'app', id: app.id })} className="p-2 rounded-lg hover:bg-error/5 text-on-surface-variant hover:text-error transition-colors"><Trash2 size={16} /></button>
                    <button onClick={() => openAddCountry(app.id)} className="p-2 rounded-lg hover:bg-primary/5 text-on-surface-variant hover:text-primary transition-colors"><Plus size={16} /></button>
                  </div>
                  {isExpanded ? <ChevronUp size={18} className="text-on-surface-variant shrink-0" /> : <ChevronDown size={18} className="text-on-surface-variant shrink-0" />}
                </div>
                {isExpanded && (
                  <div className="border-t border-outline-variant/30 divide-y divide-outline-variant/20">
                    {appCs.length === 0 && (
                      <div className="p-6 text-center text-sm text-on-surface-variant">Belum ada negara. Klik <Plus size={12} className="inline" /> untuk menambah.</div>
                    )}
                    {appCs.map(country => (
                      <div key={country.id} className="px-4 py-3 flex items-center gap-4 hover:bg-surface-container-low transition-colors">
                        <span className="text-xl shrink-0">{country.flagEmoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface">{country.countryName}</p>
                          <p className="text-xs text-on-surface-variant">
                            Stok: <span className={country.stock === 0 ? 'text-error font-bold' : country.stock <= 3 ? 'text-amber-500 font-bold' : 'text-accent-green font-bold'}>{country.stock}</span>
                            {' — '}Harga: <span className="font-semibold">{formatRupiah(country.price)}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openEditCountry(country)} className="p-1.5 rounded-lg hover:bg-primary/5 text-on-surface-variant hover:text-primary transition-colors"><Edit3 size={14} /></button>
                          <button onClick={() => setShowDeleteConfirm({ type: 'country', id: country.id })} className="p-1.5 rounded-lg hover:bg-error/5 text-on-surface-variant hover:text-error transition-colors"><Trash2 size={14} /></button>
                          <button onClick={() => openStockModal(country, 'add')} className="p-1.5 rounded-lg hover:bg-accent-green/10 text-on-surface-variant hover:text-accent-green transition-colors"><Plus size={14} /></button>
                          <button onClick={() => openStockModal(country, 'subtract')} className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"><Minus size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* App Modal */}
      {showAppModal && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowAppModal(false)}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">{editingApp ? 'Edit Aplikasi' : 'Tambah Aplikasi'}</h3>
              <button onClick={() => setShowAppModal(false)} className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Nama Aplikasi *</label>
                <input type="text" value={appName} onChange={e => setAppName(e.target.value)}
                  className="w-full border border-outline-variant rounded-xl py-2.5 px-4 text-sm bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Logo Aplikasi</label>
                <div className="flex items-center gap-4">
                  {appLogo ? (
                    <div className="relative">
                      <img src={appLogo} alt="Preview" className="w-16 h-16 object-contain rounded-xl border border-outline-variant" />
                      <button onClick={() => setAppLogo('')} className="absolute -top-2 -right-2 w-5 h-5 bg-error text-white rounded-full flex items-center justify-center text-xs"><X size={12} /></button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-surface-container-high rounded-xl border-2 border-dashed border-outline-variant flex items-center justify-center text-on-surface-variant cursor-pointer hover:border-primary transition-colors"
                      onClick={() => logoInputRef.current?.click()}>
                      <Upload size={20} />
                    </div>
                  )}
                  <button onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface hover:border-primary transition-colors">
                    {appLogo ? 'Ganti' : 'Upload'}
                  </button>
                  <input ref={logoInputRef} type="file" accept="image/png,image/svg+xml,image/webp" onChange={handleLogoUpload} className="hidden" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Deskripsi</label>
                <textarea value={appDesc} onChange={e => setAppDesc(e.target.value)} rows={2}
                  className="w-full border border-outline-variant rounded-xl py-2.5 px-4 text-sm bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-on-surface">Status</label>
                <button onClick={() => setAppActive(!appActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${appActive ? 'bg-primary' : 'bg-outline-variant'}`}>
                  <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ left: appActive ? '22px' : '2px' }} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAppModal(false)} className="flex-1 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors">Batal</button>
              <button onClick={saveApp} disabled={!appName.trim() || saving}
                className="flex-1 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Country Modal */}
      {showCountryModal && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowCountryModal(false)}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">{editingCountry ? 'Edit Negara' : 'Tambah Negara'}</h3>
              <button onClick={() => setShowCountryModal(false)} className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Negara *</label>
                <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                  className="w-full border border-outline-variant rounded-xl py-2.5 px-4 text-sm bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                  <option value="">Pilih negara...</option>
                  {COUNTRY_OPTIONS.map(c => (<option key={c.code} value={c.code}>{c.emoji} {c.name}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">Harga (Rp) *</label>
                  <input type="number" value={countryPrice} onChange={e => setCountryPrice(Number(e.target.value))} min={0}
                    className="w-full border border-outline-variant rounded-xl py-2.5 px-4 text-sm bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">Stok Awal *</label>
                  <input type="number" value={countryStock} onChange={e => setCountryStock(Number(e.target.value))} min={0}
                    className="w-full border border-outline-variant rounded-xl py-2.5 px-4 text-sm bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Deskripsi</label>
                <textarea value={countryDesc} onChange={e => setCountryDesc(e.target.value)} rows={2} placeholder="Misal: Nomor +62, bisa SMS"
                  className="w-full border border-outline-variant rounded-xl py-2.5 px-4 text-sm bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCountryModal(false)} className="flex-1 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors">Batal</button>
              <button onClick={saveCountry} disabled={!countryCode || saving}
                className="flex-1 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Modal */}
      {showStockModal && stockTarget && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowStockModal(false)}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)] mb-4">{stockAction === 'add' ? 'Tambah' : 'Kurangi'} Stok</h3>
            <p className="text-sm text-on-surface-variant mb-4">{stockTarget.flagEmoji} {stockTarget.countryName} — Stok saat ini: <span className="font-bold">{stockTarget.stock}</span></p>
            <input type="number" value={stockAmount} onChange={e => setStockAmount(Math.max(1, Number(e.target.value)))} min={1}
              className="w-full border border-outline-variant rounded-xl py-2.5 px-4 text-sm bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowStockModal(false)} className="flex-1 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors">Batal</button>
              <button onClick={handleStock} disabled={saving}
                className={`flex-1 py-2.5 rounded-full text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-50 ${stockAction === 'add' ? 'bg-accent-green' : 'bg-error'}`}>
                {stockAction === 'add' ? `+ ${stockAmount}` : `- ${stockAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-error font-[family-name:var(--font-heading)] mb-2">Konfirmasi Hapus</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              {showDeleteConfirm.type === 'app' ? 'Menghapus aplikasi akan menghapus semua negara di bawahnya. Lanjutkan?' : 'Yakin ingin menghapus negara ini?'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors">Batal</button>
              <button onClick={() => showDeleteConfirm.type === 'app' ? deleteApp(showDeleteConfirm.id) : deleteCountry(showDeleteConfirm.id)}
                className="flex-1 py-2.5 rounded-full bg-error text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
