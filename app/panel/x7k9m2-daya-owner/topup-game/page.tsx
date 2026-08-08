'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Gamepad2, Search, RefreshCw, Eye, EyeOff, Edit3, Upload,
  Loader2, X, Save, ChevronDown, ChevronUp, ImageIcon, DollarSign,
  ToggleLeft, ToggleRight, AlertCircle, CheckCircle2
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';

interface GameGroup {
  game_name: string;
  total_denoms: number;
  active_denoms: number;
  image_url: string | null;
  denoms: DenomData[];
}

interface DenomData {
  id: string;
  name: string;
  price_modal: number;
  price_sell: number;
  is_active: boolean;
  buyer_sku_code: string;
  image_url: string | null;
}

export default function OwnerTopUpGamePage() {
  const [games, setGames] = useState<GameGroup[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  // Markup modal
  const [markupModal, setMarkupModal] = useState<{ gameName: string } | null>(null);
  const [markupType, setMarkupType] = useState<'nominal' | 'percent'>('nominal');
  const [markupValue, setMarkupValue] = useState('');
  const [markupSaving, setMarkupSaving] = useState(false);

  // Image upload
  const [uploadingGame, setUploadingGame] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [targetGameForImage, setTargetGameForImage] = useState<string | null>(null);

  const loadGames = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/owner/products/game-config');
      if (res.ok) {
        const data = await res.json();
        setGames(data);
      }
    } catch (err) {
      console.error('[game-config] load error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadGames(); }, [loadGames]);

  // Sync katalog Digiflazz
  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await fetch('/api/owner/products/sync-digiflazz', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncMsg(`✅ Sinkronisasi berhasil! ${data.inserted || 0} produk baru, ${data.updated || 0} diperbarui.`);
        await loadGames();
      } else {
        setSyncMsg(`❌ Gagal: ${data.error || 'Unknown error'}`);
      }
    } catch {
      setSyncMsg('❌ Terjadi kesalahan jaringan.');
    }
    setSyncing(false);
  };

  // Toggle denom active
  const toggleDenom = async (denomId: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/owner/products/game-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: denomId, is_active: !currentActive }),
      });
      if (res.ok) {
        setGames(prev => prev.map(g => ({
          ...g,
          denoms: g.denoms.map(d => d.id === denomId ? { ...d, is_active: !currentActive } : d),
          active_denoms: g.denoms.filter(d => d.id === denomId ? !currentActive : d.is_active).length,
        })));
      }
    } catch { /* ignore */ }
  };

  // Update single denom price
  const updateDenomPrice = async (denomId: string, newPrice: number) => {
    try {
      await fetch('/api/owner/products/game-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: denomId, price_sell: newPrice }),
      });
      setGames(prev => prev.map(g => ({
        ...g,
        denoms: g.denoms.map(d => d.id === denomId ? { ...d, price_sell: newPrice } : d),
      })));
    } catch { /* ignore */ }
  };

  // Bulk activate/deactivate game
  const bulkToggleGame = async (gameName: string, activate: boolean) => {
    try {
      await fetch('/api/owner/products/game-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_name: gameName, action: activate ? 'activate_all' : 'deactivate_all' }),
      });
      setGames(prev => prev.map(g =>
        g.game_name === gameName
          ? { ...g, denoms: g.denoms.map(d => ({ ...d, is_active: activate })), active_denoms: activate ? g.total_denoms : 0 }
          : g
      ));
    } catch { /* ignore */ }
  };

  // Apply markup
  const applyMarkup = async () => {
    if (!markupModal || !markupValue) return;
    setMarkupSaving(true);
    try {
      await fetch('/api/owner/products/game-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_name: markupModal.gameName,
          action: 'set_markup',
          markup_type: markupType,
          markup_value: Number(markupValue),
        }),
      });
      await loadGames();
      setMarkupModal(null);
      setMarkupValue('');
    } catch { /* ignore */ }
    setMarkupSaving(false);
  };

  // Upload game image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetGameForImage) return;
    if (file.size > 2 * 1024 * 1024) { alert('Maks 2MB'); return; }

    setUploadingGame(targetGameForImage);
    const fd = new FormData();
    fd.append('game_name', targetGameForImage);
    fd.append('image', file);

    try {
      const res = await fetch('/api/owner/products/game-config', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        setGames(prev => prev.map(g =>
          g.game_name === targetGameForImage ? { ...g, image_url: data.image_url } : g
        ));
      }
    } catch { /* ignore */ }
    setUploadingGame(null);
    setTargetGameForImage(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const filtered = games.filter(g => {
    const matchSearch = g.game_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' && g.active_denoms > 0) || (filter === 'inactive' && g.active_denoms === 0);
    return matchSearch && matchFilter;
  });

  const totalGames = games.length;
  const activeGames = games.filter(g => g.active_denoms > 0).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
            <Gamepad2 size={28} className="text-primary" /> Top Up Game
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {totalGames} game di katalog · {activeGames} aktif dijual
          </p>
        </div>
        <button onClick={handleSync} disabled={syncing}
          className="px-5 py-2.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50">
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sinkronisasi...' : 'Sinkronkan Katalog'}
        </button>
      </div>

      {/* Sync message */}
      {syncMsg && (
        <div className={cn('p-4 rounded-xl border text-sm animate-fade-in',
          syncMsg.startsWith('✅') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800')}>
          {syncMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {([['all', 'Semua'], ['active', 'Aktif'], ['inactive', 'Belum Aktif']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={cn('px-4 py-2 rounded-full text-xs font-semibold transition-all',
                filter === key ? 'gradient-primary text-white shadow-md' : 'bg-surface-container-high border border-outline-variant text-on-surface hover:border-primary')}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari game..."
            className="w-full sm:w-64 bg-surface-container-lowest border border-outline-variant rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
        </div>
      </div>

      {/* Game List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-12 text-center shadow-soft">
          <Gamepad2 size={48} className="mx-auto text-outline-variant mb-4" />
          <p className="text-on-surface-variant font-medium">
            {games.length === 0 ? 'Belum ada game di katalog' : 'Tidak ada game yang cocok'}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {games.length === 0 ? 'Klik "Sinkronkan Katalog" untuk menarik data dari Digiflazz.' : 'Ubah filter atau kata kunci.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(game => {
            const isExpanded = expandedGame === game.game_name;
            const hasActive = game.active_denoms > 0;

            return (
              <div key={game.game_name} className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-soft overflow-hidden transition-all">
                {/* Game Row */}
                <div className="flex items-center gap-4 p-4 hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                  onClick={() => setExpandedGame(isExpanded ? null : game.game_name)}>
                  {/* Game Image */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container-high shrink-0 border border-outline-variant/20 flex items-center justify-center">
                    {game.image_url ? (
                      <img src={game.image_url} alt={game.game_name} className="w-full h-full object-cover" />
                    ) : (
                      <Gamepad2 size={20} className="text-outline-variant" />
                    )}
                  </div>

                  {/* Game Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-on-surface truncate">{game.game_name}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {game.active_denoms}/{game.total_denoms} denom aktif
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-semibold border shrink-0',
                    hasActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
                    {hasActive ? `${game.active_denoms} aktif` : 'Belum aktif'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setTargetGameForImage(game.game_name); imageInputRef.current?.click(); }}
                      className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors" title="Ganti Gambar">
                      {uploadingGame === game.game_name ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    </button>
                    <button onClick={() => setMarkupModal({ gameName: game.game_name })}
                      className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors" title="Atur Profit">
                      <DollarSign size={14} />
                    </button>
                    <button onClick={() => bulkToggleGame(game.game_name, !hasActive)}
                      className={cn('p-2 rounded-lg transition-colors', hasActive ? 'text-green-600 hover:bg-green-50' : 'text-on-surface-variant hover:bg-surface-container-high')}
                      title={hasActive ? 'Nonaktifkan Semua' : 'Aktifkan Semua'}>
                      {hasActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    </button>
                  </div>

                  {isExpanded ? <ChevronUp size={16} className="text-on-surface-variant shrink-0" /> : <ChevronDown size={16} className="text-on-surface-variant shrink-0" />}
                </div>

                {/* Expanded Denom Table */}
                {isExpanded && (
                  <div className="border-t border-outline-variant/30 bg-surface-container-low/30 animate-fade-in">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-[600px]">
                        <thead>
                          <tr className="bg-surface-container/50">
                            <th className="py-2.5 px-4 text-xs font-semibold text-on-surface-variant uppercase">Denom</th>
                            <th className="py-2.5 px-4 text-xs font-semibold text-on-surface-variant uppercase">Harga Modal</th>
                            <th className="py-2.5 px-4 text-xs font-semibold text-on-surface-variant uppercase">Harga Jual</th>
                            <th className="py-2.5 px-4 text-xs font-semibold text-on-surface-variant uppercase">Profit</th>
                            <th className="py-2.5 px-4 text-xs font-semibold text-on-surface-variant uppercase text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/30">
                          {game.denoms.map(d => {
                            const profit = Number(d.price_sell) - Number(d.price_modal);
                            return (
                              <tr key={d.id} className="hover:bg-surface-container-low transition-colors">
                                <td className="py-2.5 px-4 text-on-surface font-medium">{d.name}</td>
                                <td className="py-2.5 px-4 text-on-surface-variant">{formatRupiah(d.price_modal)}</td>
                                <td className="py-2.5 px-4">
                                  <InlineEdit value={d.price_sell} onSave={(v) => updateDenomPrice(d.id, v)} />
                                </td>
                                <td className="py-2.5 px-4">
                                  <span className={cn('text-xs font-semibold', profit > 0 ? 'text-accent-green' : profit < 0 ? 'text-error' : 'text-on-surface-variant')}>
                                    {profit > 0 ? '+' : ''}{formatRupiah(profit)}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  <button onClick={() => toggleDenom(d.id, d.is_active)}
                                    className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer hover:opacity-80',
                                      d.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
                                    {d.is_active ? 'Aktif' : 'Off'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* Bulk actions */}
                    <div className="flex items-center gap-2 p-3 border-t border-outline-variant/30 bg-surface-container/30">
                      <button onClick={() => bulkToggleGame(game.game_name, true)}
                        className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold hover:bg-green-100 transition-colors">
                        Aktifkan Semua
                      </button>
                      <button onClick={() => bulkToggleGame(game.game_name, false)}
                        className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 text-xs font-semibold hover:bg-gray-200 transition-colors">
                        Nonaktifkan Semua
                      </button>
                      <button onClick={() => setMarkupModal({ gameName: game.game_name })}
                        className="px-3 py-1.5 rounded-full bg-primary/5 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary/10 transition-colors">
                        Atur Profit Massal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden file input for image upload */}
      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

      {/* Markup Modal */}
      {markupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setMarkupModal(null)}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <DollarSign size={20} className="text-primary" />
                <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">Atur Profit — {markupModal.gameName}</h3>
              </div>
              <button onClick={() => setMarkupModal(null)} className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setMarkupType('nominal')}
                  className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                    markupType === 'nominal' ? 'gradient-primary text-white border-transparent' : 'bg-surface-container-low text-on-surface-variant border-outline-variant')}>
                  Nominal (Rp)
                </button>
                <button onClick={() => setMarkupType('percent')}
                  className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                    markupType === 'percent' ? 'gradient-primary text-white border-transparent' : 'bg-surface-container-low text-on-surface-variant border-outline-variant')}>
                  Persen (%)
                </button>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  {markupType === 'nominal' ? 'Tambah harga (Rp)' : 'Persentase markup (%)'}
                </label>
                <input type="number" value={markupValue} onChange={e => setMarkupValue(e.target.value)} min={0}
                  placeholder={markupType === 'nominal' ? '3000' : '15'}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                <p className="text-xs text-on-surface-variant mt-1.5">
                  {markupType === 'nominal' ? 'Harga jual = harga modal + nominal ini' : 'Harga jual = harga modal × (1 + persentase/100)'}
                </p>
              </div>
              <button onClick={applyMarkup} disabled={!markupValue || markupSaving}
                className="w-full py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {markupSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {markupSaving ? 'Menerapkan...' : 'Terapkan ke Semua Denom'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Inline Price Editor ─── */
function InlineEdit({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { onSave(Number(editValue)); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
          autoFocus
          className="w-24 bg-surface-container-low border border-primary rounded-lg py-1 px-2 text-xs focus:outline-none" />
        <button onClick={() => { onSave(Number(editValue)); setEditing(false); }}
          className="p-1 text-accent-green hover:bg-green-50 rounded"><CheckCircle2 size={14} /></button>
        <button onClick={() => setEditing(false)}
          className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded"><X size={14} /></button>
      </div>
    );
  }

  return (
    <button onClick={() => { setEditValue(value.toString()); setEditing(true); }}
      className="text-on-surface font-semibold hover:text-primary transition-colors flex items-center gap-1 group">
      {formatRupiah(value)}
      <Edit3 size={10} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
