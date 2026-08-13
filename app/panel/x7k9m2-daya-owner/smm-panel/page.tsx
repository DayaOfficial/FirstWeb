'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RefreshCw, Search, Check, ChevronDown, ChevronRight, Share2 } from 'lucide-react';

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
}

export default function SmmPanelOwnerPage() {
  const sb = createClient();
  const [rows, setRows] = useState<SmmProduct[]>([]);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb.from('products').select('*')
      .eq('module', 'jokerpanel')
      .order('brand').order('price_modal');
    setRows((data as SmmProduct[]) || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function sync() {
    setBusy(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/owner/products/sync-jokerpanel', { method: 'POST' });
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

  async function patch(id: string, p: Partial<SmmProduct>) {
    await sb.from('products').update(p).eq('id', id);
    load();
  }

  async function onMarkup(r: SmmProduct, val: number) {
    await patch(r.id, {
      markup_value: val,
      price_sell: Math.round(r.price_modal + val),
    });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
            <Share2 size={28} className="text-primary" /> SMM Panel
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {rows.length} layanan · {rows.filter(r => r.is_active).length} aktif · Provider: JokerPanel
          </p>
        </div>
        <button onClick={sync} disabled={busy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-50">
          <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />
          {busy ? 'Menyinkronkan...' : 'Sinkronkan JokerPanel'}
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
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari layanan atau platform..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
      </div>

      {platforms.length === 0 && (
        <div className="text-center py-16 text-on-surface-variant">
          <p className="text-sm">Belum ada layanan. Klik &quot;Sinkronkan JokerPanel&quot; untuk menarik data.</p>
        </div>
      )}

      {platforms.map(p => {
        const pRows = filtered.filter(r => r.brand === p);
        const activeCount = pRows.filter(r => r.is_active).length;
        const isExpanded = expandedPlatforms.has(p);

        return (
          <div key={p} className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-soft overflow-hidden">
            <button
              onClick={() => togglePlatform(p)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown size={18} className="text-primary" /> : <ChevronRight size={18} className="text-on-surface-variant" />}
                <span className="font-bold text-on-surface capitalize">{p}</span>
                <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                  {pRows.length} layanan · {activeCount} aktif
                </span>
              </div>
            </button>

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
                        M: Rp {Number(r.price_modal).toLocaleString('id-ID')}
                      </span>
                      <input
                        type="number"
                        defaultValue={r.markup_value}
                        onBlur={e => onMarkup(r, Number(e.target.value))}
                        className="w-20 px-2 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary transition-colors"
                        title="Markup (nominal)"
                      />
                      <span className="text-sm font-bold text-primary font-mono min-w-[90px] text-right">
                        Rp {Number(r.price_sell).toLocaleString('id-ID')}
                      </span>
                      <button
                        onClick={() => patch(r.id, { is_active: !r.is_active })}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${r.is_active ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30 hover:border-green-300'}`}
                      >
                        {r.is_active && <Check size={14} />}
                      </button>
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
