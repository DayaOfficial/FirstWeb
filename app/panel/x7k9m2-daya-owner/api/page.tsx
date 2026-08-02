'use client';

import { useState } from 'react';
import { Link2, CheckCircle2, AlertCircle, Settings, X, Save, Eye, EyeOff, Loader2 } from 'lucide-react';

interface ApiConfig {
  digiflazz: { username: string; apiKey: string; mode: string };
  jokerpanel: { baseUrl: string; apiKey: string };
  pakasir: { merchantCode: string; apiKey: string };
}

export default function OwnerApiPage() {
  const [editing, setEditing] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const [config, setConfig] = useState<ApiConfig>({
    digiflazz: {
      username: process.env.NEXT_PUBLIC_DIGIFLAZZ_USERNAME || 'tuwumiWXAdqg',
      apiKey: process.env.NEXT_PUBLIC_DIGIFLAZZ_API_KEY || '',
      mode: 'development',
    },
    jokerpanel: {
      baseUrl: 'https://jokerpanel.com/api/v2',
      apiKey: process.env.NEXT_PUBLIC_JOKERPANEL_API_KEY || '',
    },
    pakasir: {
      merchantCode: '',
      apiKey: '',
    },
  });

  const maskKey = (key: string) => {
    if (!key) return '-';
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 6) + '••••••';
  };

  const handleSave = async (provider: string) => {
    setSaving(true);
    // Simpan ke env atau DB — untuk sekarang simpan ke localStorage
    localStorage.setItem(`daya_api_${provider}`, JSON.stringify(
      provider === 'digiflazz' ? config.digiflazz :
      provider === 'jokerpanel' ? config.jokerpanel : config.pakasir
    ));
    await new Promise(r => setTimeout(r, 500));
    setSaving(false);
    setSaved(provider);
    setEditing(null);
    setTimeout(() => setSaved(null), 2000);
  };

  const providers = [
    {
      id: 'digiflazz',
      name: 'Digiflazz',
      desc: 'Pulsa, Data, Token, Voucher',
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      badge: 'DF',
      connected: !!config.digiflazz.apiKey,
      fields: [
        { key: 'username', label: 'Username', value: config.digiflazz.username, type: 'text' },
        { key: 'apiKey', label: 'API Key', value: config.digiflazz.apiKey, type: 'password' },
        { key: 'mode', label: 'Mode', value: config.digiflazz.mode, type: 'select', options: ['development', 'production'] },
      ],
    },
    {
      id: 'jokerpanel',
      name: 'JokerPanel',
      desc: 'SMM Panel Services',
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      badge: 'JP',
      connected: !!config.jokerpanel.apiKey,
      fields: [
        { key: 'baseUrl', label: 'Base URL', value: config.jokerpanel.baseUrl, type: 'text' },
        { key: 'apiKey', label: 'API Key', value: config.jokerpanel.apiKey, type: 'password' },
      ],
    },
    {
      id: 'pakasir',
      name: 'Pakasir (QRIS)',
      desc: 'Payment Gateway',
      color: 'amber',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-600',
      badge: 'PK',
      connected: !!config.pakasir.apiKey,
      fields: [
        { key: 'merchantCode', label: 'Merchant Code', value: config.pakasir.merchantCode, type: 'text' },
        { key: 'apiKey', label: 'API Key', value: config.pakasir.apiKey, type: 'password' },
      ],
    },
  ];

  const updateField = (providerId: string, fieldKey: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [providerId]: { ...prev[providerId as keyof ApiConfig], [fieldKey]: value },
    }));
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
        {providers.map((p) => (
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
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-semibold border border-green-200">
                  <CheckCircle2 size={12} /> Tersimpan
                </span>
              ) : p.connected ? (
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
                    <div key={f.key} className="flex justify-between">
                      <span className="text-on-surface-variant">{f.label}</span>
                      <span className="font-mono text-xs text-on-surface">
                        {f.type === 'password' ? maskKey(f.value) : (f.value || '-')}
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
                      {f.type === 'select' ? (
                        <select
                          value={f.value}
                          onChange={e => updateField(p.id, f.key, e.target.value)}
                          className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                          {f.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="relative">
                          <input
                            type={f.type === 'password' && !showKeys[`${p.id}_${f.key}`] ? 'password' : 'text'}
                            value={f.value}
                            onChange={e => updateField(p.id, f.key, e.target.value)}
                            placeholder={`Masukkan ${f.label}`}
                            className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 pr-10 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                          {f.type === 'password' && (
                            <button
                              type="button"
                              onClick={() => setShowKeys(prev => ({ ...prev, [`${p.id}_${f.key}`]: !prev[`${p.id}_${f.key}`] }))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                            >
                              {showKeys[`${p.id}_${f.key}`] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          )}
                        </div>
                      )}
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
        ))}
      </div>
    </div>
  );
}
