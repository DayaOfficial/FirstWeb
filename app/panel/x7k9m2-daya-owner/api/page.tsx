'use client';

import { useState, useEffect } from 'react';
import { Link2, CheckCircle2, AlertCircle, Settings, X, Save, Eye, EyeOff, Loader2, Upload, Zap, Search } from 'lucide-react';

interface ProviderConfig {
  [key: string]: string;
}

interface ProviderDef {
  id: string;
  name: string;
  desc: string;
  badge: string;
  bgColor: string;
  textColor: string;
  // Map from field key to settings table key
  settingsMap: Record<string, string>;
  fields: { key: string; label: string; type: 'text' | 'password'; placeholder: string; helper?: string }[];
}

const PROVIDERS: ProviderDef[] = [
  {
    id: 'digiflazz',
    name: 'Digiflazz',
    desc: 'Pulsa, Data, Token, Voucher',
    badge: 'DF',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    settingsMap: {
      username: 'digiflazz_username',
      apiKey: 'digiflazz_api_key',
      nomorTujuan: 'digiflazz_nomor_tujuan',
      kodeProduk: 'digiflazz_kode_produk',
    },
    fields: [
      { key: 'username', label: 'Username', type: 'text', placeholder: 'Masukkan username Digiflazz' },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Masukkan API Key' },
      { key: 'nomorTujuan', label: 'Nomor Tujuan (Testing)', type: 'text', placeholder: '08xxxxxxxxxx', helper: 'Nomor HP untuk testing transaksi' },
      { key: 'kodeProduk', label: 'Kode Produk (Testing)', type: 'text', placeholder: 'xld10', helper: 'Kode SKU produk untuk testing' },
    ],
  },
  {
    id: 'jokerpanel',
    name: 'JokerPanel',
    desc: 'SMM Panel Services',
    badge: 'JP',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    settingsMap: {
      baseUrl: 'jokerpanel_base_url',
      apiKey: 'jokerpanel_api_key',
    },
    fields: [
      { key: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'https://jokerpanel.com/api/v2' },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Masukkan API Key JokerPanel' },
    ],
  },
  {
    id: 'pakasir',
    name: 'Pakasir (QRIS)',
    desc: 'Payment Gateway',
    badge: 'PK',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
    settingsMap: {
      slug: 'pakasir_merchant_code',
      apiKey: 'pakasir_api_key',
    },
    fields: [
      { key: 'slug', label: 'Slug', type: 'text', placeholder: 'Masukkan slug merchant Pakasir' },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Masukkan API Key Pakasir' },
    ],
  },
];

export default function OwnerApiPage() {
  const [editing, setEditing] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrateMsg, setMigrateMsg] = useState('');
  const [testResult, setTestResult] = useState<{ provider: string; msg: string; ok: boolean } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, ProviderConfig>>({
    digiflazz: { username: '', apiKey: '', nomorTujuan: '', kodeProduk: '' },
    jokerpanel: { baseUrl: 'https://jokerpanel.com/api/v2', apiKey: '' },
    pakasir: { slug: '', apiKey: '' },
  });

  // Test Digiflazz connection
  const handleTestDigiflazz = async () => {
    setTesting('digiflazz');
    setTestResult(null);
    try {
      const res = await fetch('/api/owner/digiflazz/test', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setTestResult({ provider: 'digiflazz', msg: `✅ Terhubung! Saldo: Rp ${Number(data.balance).toLocaleString('id-ID')}`, ok: true });
      } else {
        setTestResult({ provider: 'digiflazz', msg: `❌ ${data.error}`, ok: false });
      }
    } catch {
      setTestResult({ provider: 'digiflazz', msg: '❌ Kesalahan jaringan', ok: false });
    }
    setTesting(null);
  };

  // Detect JokerPanel endpoint
  const handleDetectJoker = async () => {
    setTesting('jokerpanel');
    setTestResult(null);
    try {
      const res = await fetch('/api/owner/joker/detect', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setTestResult({ provider: 'jokerpanel', msg: `✅ Endpoint ditemukan: ${data.url} — Saldo: $${Number(data.balance).toFixed(2)}`, ok: true });
        // Update baseUrl in form
        setConfigs(prev => ({ ...prev, jokerpanel: { ...prev.jokerpanel, baseUrl: data.url } }));
      } else {
        setTestResult({ provider: 'jokerpanel', msg: `❌ ${data.error}`, ok: false });
      }
    } catch {
      setTestResult({ provider: 'jokerpanel', msg: '❌ Kesalahan jaringan', ok: false });
    }
    setTesting(null);
  };

  // Load saved configs from Supabase settings table
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/owner/settings');
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          console.error('[API Config] load error:', errData?.error || res.status);
        }
        if (res.ok) {
          const settings: Record<string, string> = await res.json();

          // Map settings keys back to provider fields
          const newConfigs: Record<string, ProviderConfig> = { ...configs };
          PROVIDERS.forEach(p => {
            const providerConfig: ProviderConfig = { ...newConfigs[p.id] };
            Object.entries(p.settingsMap).forEach(([fieldKey, settingsKey]) => {
              if (settings[settingsKey]) {
                providerConfig[fieldKey] = settings[settingsKey];
              }
            });
            newConfigs[p.id] = providerConfig;
          });

          setConfigs(newConfigs);
        }
      } catch (err) {
        console.error('[API Config] load settings error:', err);
      } finally {
        setLoadingSettings(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if there's old localStorage data to migrate
  const hasLocalStorageData = () => {
    if (typeof window === 'undefined') return false;
    return PROVIDERS.some(p => localStorage.getItem(`daya_api_${p.id}`));
  };

  // Migrate localStorage → Supabase
  const handleMigrate = async () => {
    setMigrating(true);
    setMigrateMsg('');
    try {
      const settingsToMigrate: Record<string, string> = {};

      PROVIDERS.forEach(p => {
        const stored = localStorage.getItem(`daya_api_${p.id}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            Object.entries(p.settingsMap).forEach(([fieldKey, settingsKey]) => {
              if (parsed[fieldKey]) {
                settingsToMigrate[settingsKey] = parsed[fieldKey];
              }
            });
          } catch { /* ignore */ }
        }
      });

      if (Object.keys(settingsToMigrate).length === 0) {
        setMigrateMsg('Tidak ada data lokal untuk dimigrasikan.');
        setMigrating(false);
        return;
      }

      const res = await fetch('/api/owner/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToMigrate),
      });

      if (res.ok) {
        // Hapus localStorage setelah berhasil
        PROVIDERS.forEach(p => localStorage.removeItem(`daya_api_${p.id}`));
        setMigrateMsg(`✅ Migrasi berhasil! ${Object.keys(settingsToMigrate).length} pengaturan dipindahkan ke Supabase.`);
        // Reload configs
        window.location.reload();
      } else {
        setMigrateMsg('❌ Gagal migrasi. Coba lagi.');
      }
    } catch {
      setMigrateMsg('❌ Terjadi kesalahan jaringan.');
    }
    setMigrating(false);
  };

  const maskKey = (key: string) => {
    if (!key) return '-';
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 6) + '••••••';
  };

  const isConnected = (providerId: string) => {
    const c = configs[providerId];
    return c && c.apiKey && c.apiKey.length > 0;
  };

  const updateField = (providerId: string, fieldKey: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [providerId]: { ...prev[providerId], [fieldKey]: value },
    }));
  };

  // Save to Supabase (not localStorage)
  const handleSave = async (providerId: string) => {
    setSaving(true);
    try {
      const provider = PROVIDERS.find(p => p.id === providerId)!;
      const settingsToSave: Record<string, string> = {};

      Object.entries(provider.settingsMap).forEach(([fieldKey, settingsKey]) => {
        settingsToSave[settingsKey] = configs[providerId][fieldKey] || '';
      });

      const res = await fetch('/api/owner/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave),
      });

      if (res.ok) {
        setSaved(providerId);
        setEditing(null);
        setTimeout(() => setSaved(null), 2000);
      } else {
        const errData = await res.json().catch(() => null);
        const msg = errData?.error || `HTTP ${res.status}`;
        alert('Gagal menyimpan: ' + msg);
        console.error('[API Config] save error:', msg);
      }
    } catch (err: any) {
      alert('Gagal menyimpan: Kesalahan jaringan');
      console.error('[API Config] save error:', err);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
          <Link2 size={28} className="text-primary" />
          Koneksi API
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">Kelola koneksi ke provider layanan digital. Semua konfigurasi tersimpan di cloud (Supabase) — sinkron di semua perangkat.</p>
      </div>

      {/* Migrasi Banner */}
      {!loadingSettings && hasLocalStorageData() && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <Upload size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Data Lokal Terdeteksi</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Anda memiliki konfigurasi API yang tersimpan secara lokal di perangkat ini. Migrasi ke Supabase agar sinkron di semua perangkat.
              </p>
            </div>
          </div>
          <button onClick={handleMigrate} disabled={migrating}
            className="w-full py-2.5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {migrating ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {migrating ? 'Memproses...' : 'Migrasi Data Lokal ke Supabase'}
          </button>
          {migrateMsg && (
            <p className={`text-xs ${migrateMsg.startsWith('✅') ? 'text-green-700' : 'text-red-700'}`}>{migrateMsg}</p>
          )}
        </div>
      )}

      {loadingSettings ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {PROVIDERS.map((p) => {
            const config = configs[p.id] || {};
            const connected = isConnected(p.id);

            return (
              <div key={p.id} className="bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/20">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${p.bgColor} ${p.textColor} flex items-center justify-center font-bold text-sm`}>
                      {p.badge}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-on-surface">{p.name}</h3>
                      <p className="text-xs text-on-surface-variant">{p.desc}</p>
                    </div>
                  </div>
                  {saved === p.id ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-semibold border border-green-200 animate-fade-in">
                      <CheckCircle2 size={12} /> Tersimpan!
                    </span>
                  ) : connected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-semibold border border-green-200">
                      <CheckCircle2 size={12} /> Terhubung
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-semibold border border-amber-200">
                      <AlertCircle size={12} /> Belum Dikonfigurasi
                    </span>
                  )}
                </div>

                {/* View Mode */}
                {editing !== p.id && (
                  <>
                    <div className="space-y-2 text-sm">
                      {p.fields.map((f) => (
                        <div key={f.key} className="flex justify-between items-center">
                          <span className="text-on-surface-variant">{f.label}</span>
                          <span className="font-mono text-xs text-on-surface">
                            {f.type === 'password' ? maskKey(config[f.key] || '') : (config[f.key] || '-')}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setEditing(p.id)}
                        className="flex-1 py-2.5 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Settings size={14} /> Konfigurasi
                      </button>
                      {p.id === 'digiflazz' && connected && (
                        <button
                          onClick={handleTestDigiflazz}
                          disabled={testing === 'digiflazz'}
                          className="px-4 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {testing === 'digiflazz' ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                          Uji
                        </button>
                      )}
                      {p.id === 'jokerpanel' && connected && (
                        <button
                          onClick={handleDetectJoker}
                          disabled={testing === 'jokerpanel'}
                          className="px-4 py-2.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-sm font-semibold hover:bg-purple-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {testing === 'jokerpanel' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                          Deteksi
                        </button>
                      )}
                    </div>
                    {testResult && testResult.provider === p.id && (
                      <div className={`mt-3 p-3 rounded-xl text-xs font-medium animate-fade-in ${testResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {testResult.msg}
                      </div>
                    )}
                  </>
                )}

                {/* Edit Mode */}
                {editing === p.id && (
                  <>
                    <div className="space-y-3">
                      {p.fields.map((f) => (
                        <div key={f.key}>
                          <label className="block text-xs font-semibold text-on-surface mb-1">{f.label}</label>
                          <div className="relative">
                            <input
                              type={f.type === 'password' && !showKeys[`${p.id}_${f.key}`] ? 'password' : 'text'}
                              value={config[f.key] || ''}
                              onChange={e => updateField(p.id, f.key, e.target.value)}
                              placeholder={f.placeholder}
                              className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-3 pr-10 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                            {f.type === 'password' && (
                              <button
                                type="button"
                                onClick={() => setShowKeys(prev => ({ ...prev, [`${p.id}_${f.key}`]: !prev[`${p.id}_${f.key}`] }))}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                              >
                                {showKeys[`${p.id}_${f.key}`] ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            )}
                          </div>
                          {f.helper && <p className="text-[11px] text-on-surface-variant mt-0.5">{f.helper}</p>}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleSave(p.id)}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-lg gradient-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface-variant hover:text-error hover:border-error transition-colors flex items-center gap-1"
                      >
                        <X size={14} /> Batal
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
