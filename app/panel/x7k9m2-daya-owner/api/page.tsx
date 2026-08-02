'use client';

import { useState, useEffect } from 'react';
import { Link2, CheckCircle2, AlertCircle, Settings, X, Save, Eye, EyeOff, Loader2 } from 'lucide-react';

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
  const [configs, setConfigs] = useState<Record<string, ProviderConfig>>({
    digiflazz: { username: '', apiKey: '', nomorTujuan: '', kodeProduk: '' },
    jokerpanel: { baseUrl: 'https://jokerpanel.com/api/v2', apiKey: '' },
    pakasir: { slug: '', apiKey: '' },
  });

  // Load saved configs from localStorage
  useEffect(() => {
    PROVIDERS.forEach(p => {
      const stored = localStorage.getItem(`daya_api_${p.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setConfigs(prev => ({ ...prev, [p.id]: { ...prev[p.id], ...parsed } }));
        } catch { /* ignore */ }
      }
    });

    // Juga cek env vars sebagai default
    const envDigiUsername = process.env.NEXT_PUBLIC_DIGIFLAZZ_USERNAME;
    const envDigiKey = process.env.NEXT_PUBLIC_DIGIFLAZZ_API_KEY;
    const envJokerKey = process.env.NEXT_PUBLIC_JOKERPANEL_API_KEY;

    setConfigs(prev => ({
      ...prev,
      digiflazz: {
        ...prev.digiflazz,
        username: prev.digiflazz.username || envDigiUsername || '',
        apiKey: prev.digiflazz.apiKey || envDigiKey || '',
      },
      jokerpanel: {
        ...prev.jokerpanel,
        apiKey: prev.jokerpanel.apiKey || envJokerKey || '',
      },
    }));
  }, []);

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

  const handleSave = async (providerId: string) => {
    setSaving(true);
    localStorage.setItem(`daya_api_${providerId}`, JSON.stringify(configs[providerId]));
    await new Promise(r => setTimeout(r, 500));
    setSaving(false);
    setSaved(providerId);
    setEditing(null);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
          <Link2 size={28} className="text-primary" />
          Koneksi API
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">Kelola koneksi ke provider layanan digital.</p>
      </div>

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
                  <button
                    onClick={() => setEditing(p.id)}
                    className="mt-4 w-full py-2.5 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Settings size={14} /> Konfigurasi
                  </button>
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
    </div>
  );
}
