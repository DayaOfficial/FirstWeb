'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RefreshCw, Search, Check, ChevronDown, ChevronRight, Share2, Image as ImageIcon, X, Percent, Save } from 'lucide-react';

interface SmmProduct {
  id: string;
  name: string;
  brand: string;
  price_modal: number;
  price_sell: number;
  markup_value: number;
  is_active: boolean;
  description: string | null;
  provider_service_id: string;
  platform_icon_url: string | null;
}

export default function SmmPanelOwnerPage() {
  const sb = createClient();
  const [rows, setRows] = useState<SmmProduct[]>([]);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // State untuk upload ikon platform
  const [editingIcon, setEditingIcon] = useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState<number | null>(null);

  // Global markup (profit %)
  const [markupPercent, setMarkupPercent] = useState<number>(30);
  const [markupInput, setMarkupInput] = useState<string>('30');
  const [savingMarkup, setSavingMarkup] = useState(false);
  const [markupSaved, setMarkupSaved] = useState(false);

  // Load global markup setting from database
  const loadMarkup = useCallback(async () => {
    const { data } = await sb.from('settings').select('value').eq('key', 'sprint_markup_percent').single();
    if (data?.value) {
      const val = Number(data.value);
      setMarkupPercent(val);
      setMarkupInput(String(val));
    }
  }, []);

  const load = useCallback(async () => {
    // 1) Live-fetch dari SprintPedia API (sama seperti store page)
    try {
      const res = await fetch('/api/store/smm-live');
      const json = await res.json();
      if (json.services && json.services.length > 0) {
        const liveRows: SmmProduct[] = json.services.map((s: any) => ({
          id: s.id || s.provider_code,
          name: s.name,
          brand: s.brand,
          price_modal: Number(s.price_modal) || 0,
          price_sell: Number(s.price_sell) || 0,
          markup_value: Number(s.price_sell) - Number(s.price_modal) || 0,
          is_active: s.is_active !== false,
          description: s.description || null,
          provider_service_id: s.provider_code || s.id,
          platform_icon_url: s.platform_icon_url || null,
        }));
        setRows(liveRows);
        setLiveCount(json.total || liveRows.length);
        return;
      }
    } catch { /* silent — fallback below */ }

    // 2) Fallback: database
    const { data } = await sb.from('products').select('*')
      .eq('module', 'sprintpedia')
      .order('brand').order('price_modal');
    const dbRows = (data as SmmProduct[]) || [];
    setRows(dbRows);

    // Auto-sync jika database juga kosong
    if (dbRows.length === 0) {
      setBusy(true);
      setSyncResult('🔄 Menyinkronkan otomatis dari SprintPedia...');
      try {
        const res = await fetch('/api/owner/products/sync-sprintpedia', { method: 'POST' });
        const syncData = await res.json();
        if (res.ok) {
          setSyncResult(`✅ ${syncData.synced} layanan disinkronkan!`);
          const { data: newData } = await sb.from('products').select('*')
            .eq('module', 'sprintpedia')
            .order('brand').order('price_modal');
          setRows((newData as SmmProduct[]) || []);
        } else {
          setSyncResult(`❌ ${syncData.error}`);
        }
      } catch {
        setSyncResult('❌ Gagal sinkronkan');
      }
      setBusy(false);
      setTimeout(() => setSyncResult(null), 5000);
    }
  }, []);

  useEffect(() => { load(); loadMarkup(); }, [load, loadMarkup]);

  async function sync() {
    setBusy(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/owner/products/sync-sprintpedia', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(`✅ ${data.synced} layanan disinkronkan`);
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

  // Save global markup to settings table
  async function saveGlobalMarkup() {
    const val = Number(markupInput);
    if (isNaN(val) || val < 0 || val > 1000) {
      alert('Markup harus antara 0-1000%');
      return;
    }
    setSavingMarkup(true);
    try {
      // Upsert ke settings table
      await sb.from('settings').upsert({ key: 'sprint_markup_percent', value: String(val) }, { onConflict: 'key' });
      setMarkupPercent(val);
      setMarkupSaved(true);
      setTimeout(() => setMarkupSaved(false), 3000);
      // Reload data to reflect new prices
      await load();
    } catch {
      alert('Gagal menyimpan markup');
    }
    setSavingMarkup(false);
  }

  // Set icon URL untuk semua produk dengan brand yang sama
  async function savePlatformIcon(platformName: string, url: string) {
    const trimmed = url.trim();
    const targetRows = rows.filter(r => r.brand === platformName);
    for (const r of targetRows) {
      await sb.from('products').update({ platform_icon_url: trimmed || null }).eq('id', r.id);
    }
    setEditingIcon(null);
    await load();
  }

  function togglePlatform(p: string) {
    setExpandedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  }

  const filtered = rows.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.brand.toLowerCase().includes(search.toLowerCase())
  );
  const platforms = Array.from(new Set(filtered.map(r => r.brand)));

  // Ambil icon URL per platform (dari produk pertama yang punya)
  function getPlatformIconUrl(platformName: string): string | null {
    const found = rows.find(r => r.brand === platformName && r.platform_icon_url);
    return found?.platform_icon_url || null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
            <Share2 size={28} className="text-primary" /> SMM Panel
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {rows.length} layanan dari SprintPedia · {rows.filter(r => r.is_active).length} aktif
            {liveCount !== null && (
              <span className="text-accent-green font-semibold"> · Live API ✅</span>
            )}
          </p>
        </div>
        <button onClick={sync} disabled={busy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-50">
          <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />
          {busy ? 'Menyinkronkan...' : 'Sinkronkan SprintPedia'}
        </button>
      </div>

      {syncResult && (
        <div className={`text-sm px-4 py-2.5 rounded-xl animate-fade-in ${syncResult.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : syncResult.startsWith('🔄') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {syncResult}
        </div>
      )}

      {/* ═══════ GLOBAL PROFIT SETTING ═══════ */}
      <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-soft p-5">
        <div className="flex items-center gap-2 mb-3">
          <Percent size={18} className="text-primary" />
          <h3 className="font-bold text-on-surface text-sm">Pengaturan Profit Global</h3>
        </div>
        <p className="text-xs text-on-surface-variant mb-4">
          Atur persentase profit untuk <strong>semua layanan</strong> sekaligus. Harga jual = Harga modal + {markupPercent}% markup.
        </p>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <input
              type="number"
              value={markupInput}
              onChange={e => setMarkupInput(e.target.value)}
              min={0}
              max={1000}
              className="w-full px-4 py-3 pr-12 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm font-bold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="30"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant">%</span>
          </div>
          <button
            onClick={saveGlobalMarkup}
            disabled={savingMarkup || markupInput === String(markupPercent)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40"
          >
            <Save size={14} />
            {savingMarkup ? 'Menyimpan...' : 'Simpan'}
          </button>
          {markupSaved && (
            <span className="text-sm text-accent-green font-semibold animate-fade-in">✅ Tersimpan!</span>
          )}
        </div>
        <div className="mt-3 p-3 bg-primary/5 rounded-xl text-xs text-on-surface-variant">
          <strong>Contoh:</strong> Harga modal Rp 10.000 + markup {markupPercent}% = <strong className="text-primary">Rp {Math.round(10000 * (1 + Number(markupInput || 0) / 100)).toLocaleString('id-ID')}</strong>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari layanan atau platform..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
      </div>

      {platforms.length === 0 && (
        <div className="text-center py-16 text-on-surface-variant">
          <p className="text-sm">Belum ada layanan. Klik &quot;Sinkronkan SprintPedia&quot; untuk menarik data.</p>
        </div>
      )}

      {platforms.map(p => {
        const pRows = filtered.filter(r => r.brand === p);
        const activeCount = pRows.filter(r => r.is_active).length;
        const isExpanded = expandedPlatforms.has(p);
        const currentIconUrl = getPlatformIconUrl(p);

        return (
          <div key={p} className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-soft overflow-hidden">
            <div className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-container-low transition-colors">
              <button
                onClick={() => togglePlatform(p)}
                className="flex items-center gap-3 flex-1"
              >
                {isExpanded ? <ChevronDown size={18} className="text-primary" /> : <ChevronRight size={18} className="text-on-surface-variant" />}

                {/* Ikon platform */}
                {currentIconUrl ? (
                  <img src={currentIconUrl} alt={p} className="w-6 h-6 rounded object-contain" />
                ) : (
                  <div className="w-6 h-6 rounded bg-surface-container-high flex items-center justify-center">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">{p.charAt(0)}</span>
                  </div>
                )}

                <span className="font-bold text-on-surface capitalize">{p}</span>
                <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                  {pRows.length} layanan · {activeCount} aktif
                </span>
              </button>

              {/* Tombol set ikon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingIcon(editingIcon === p ? null : p);
                }}
                className={`ml-2 p-2 rounded-lg text-xs font-medium transition-colors ${
                  currentIconUrl
                    ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                    : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30 hover:border-primary/40'
                }`}
                title="Atur ikon platform"
              >
                <ImageIcon size={14} />
              </button>
            </div>

            {/* Panel upload ikon */}
            {editingIcon === p && (
              <div className="px-5 pb-4 pt-0 border-t border-outline-variant/20 animate-fade-in">
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                  {currentIconUrl && (
                    <img src={currentIconUrl} alt={p} className="w-10 h-10 rounded-lg object-contain border border-outline-variant/30 shrink-0" />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium text-on-surface">
                    <ImageIcon size={16} className="text-primary" />
                    {uploadingIcon === p ? 'Mengupload...' : currentIconUrl ? 'Ganti Ikon' : 'Upload Ikon'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingIcon === p}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          alert('Ukuran gambar maksimal 2MB.');
                          return;
                        }
                        setUploadingIcon(p);
                        try {
                          const ext = file.name.split('.').pop() || 'png';
                          const path = `platform-icons/${p.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.${ext}`;
                          const { error: upErr } = await sb.storage.from('brand-logos').upload(path, file, { upsert: true });
                          if (upErr) {
                            alert('Gagal upload: ' + upErr.message);
                            return;
                          }
                          const { data: urlData } = sb.storage.from('brand-logos').getPublicUrl(path);
                          await savePlatformIcon(p, urlData.publicUrl);
                        } catch (err: any) {
                          alert('Gagal upload ikon.');
                          console.error(err);
                        } finally {
                          setUploadingIcon(null);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                  {currentIconUrl && (
                    <button
                      onClick={() => savePlatformIcon(p, '')}
                      className="px-3 py-2 rounded-lg text-xs font-semibold text-error border border-error/30 hover:bg-error/10 transition-colors"
                      title="Hapus ikon"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {isExpanded && (
              <div className="border-t border-outline-variant/20 divide-y divide-outline-variant/10">
                {pRows.map(r => (
                  <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-5 py-3 hover:bg-surface-container-low/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-on-surface font-medium truncate">{r.name}</p>
                      {r.description && (
                        <p className="text-[11px] text-on-surface-variant truncate mt-0.5">{r.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-on-surface-variant font-mono">
                        Modal: Rp {Number(r.price_modal).toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs text-on-surface-variant">→</span>
                      <span className="text-sm font-bold text-primary font-mono min-w-[90px] text-right">
                        Rp {Number(r.price_sell).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
