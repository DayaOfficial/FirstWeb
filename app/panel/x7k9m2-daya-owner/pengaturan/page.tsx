'use client';

import { Settings, Store, Bell, Shield, Globe, Save } from 'lucide-react';
import { useState } from 'react';

export default function OwnerPengaturanPage() {
  const [storeName, setStoreName] = useState('DAYA MART');
  const [storeUrl, setStoreUrl] = useState('https://dayamartofficial.my.id');
  const [ownerWa, setOwnerWa] = useState('087800001232');
  const [ownerEmail, setOwnerEmail] = useState('owner@dayamart.com');
  const [notifRegistrasi, setNotifRegistrasi] = useState(true);
  const [notifPesanan, setNotifPesanan] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
          <Settings size={28} className="text-primary" />
          Pengaturan
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">Konfigurasi toko dan preferensi sistem.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Info */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/20">
          <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2 font-[family-name:var(--font-heading)]">
            <Store size={18} className="text-primary" /> Informasi Toko
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">Nama Toko</label>
              <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">URL Website</label>
              <input type="text" value={storeUrl} onChange={e => setStoreUrl(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
          </div>
        </div>

        {/* Owner Contact */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/20">
          <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2 font-[family-name:var(--font-heading)]">
            <Shield size={18} className="text-primary" /> Kontak Owner
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">WhatsApp Owner</label>
              <input type="tel" value={ownerWa} onChange={e => setOwnerWa(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">Email Owner</label>
              <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/20">
          <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2 font-[family-name:var(--font-heading)]">
            <Bell size={18} className="text-primary" /> Notifikasi
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-on-surface">Registrasi Akun Baru</p>
                <p className="text-xs text-on-surface-variant">Terima notifikasi saat ada registrasi baru</p>
              </div>
              <button onClick={() => setNotifRegistrasi(!notifRegistrasi)}
                className={`w-12 h-7 rounded-full transition-colors duration-200 relative shrink-0 ${notifRegistrasi ? 'bg-primary' : 'bg-gray-300'}`}>
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${notifRegistrasi ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-on-surface">Pesanan Masuk</p>
                <p className="text-xs text-on-surface-variant">Terima notifikasi saat ada pesanan baru</p>
              </div>
              <button onClick={() => setNotifPesanan(!notifPesanan)}
                className={`w-12 h-7 rounded-full transition-colors duration-200 relative shrink-0 ${notifPesanan ? 'bg-primary' : 'bg-gray-300'}`}>
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${notifPesanan ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* App Settings */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/20">
          <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2 font-[family-name:var(--font-heading)]">
            <Globe size={18} className="text-primary" /> Umum
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Versi Aplikasi</span>
              <span className="font-semibold text-on-surface">v0.1.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Framework</span>
              <span className="font-semibold text-on-surface">Next.js 16</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-on-surface-variant">Panel Route</span>
              <span className="font-mono text-xs text-on-surface">/panel/x7k9m2-daya-owner</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave}
          className={`px-8 py-3 rounded-full font-semibold text-sm shadow-md transition-all flex items-center gap-2 ${saved ? 'bg-green-500 text-white' : 'gradient-primary text-white hover:opacity-90'}`}>
          <Save size={16} />
          {saved ? 'Tersimpan!' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  );
}
