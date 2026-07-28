'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, ArrowLeft, Package, MessageCircle } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import BrandImage from '@/components/ui/BrandImage';
import type { NokosApp, NokosCountry } from '@/types';

/* ─── Default seed data ─── */
const DEFAULT_APPS: NokosApp[] = [
  { id: 'nk-1', name: 'Telegram', logoUrl: '', description: 'Nomor kosong Telegram untuk registrasi.', isActive: true, sortOrder: 0 },
  { id: 'nk-2', name: 'WhatsApp', logoUrl: '', description: 'Nomor kosong WhatsApp untuk verifikasi.', isActive: true, sortOrder: 1 },
  { id: 'nk-3', name: 'Shopee', logoUrl: '', description: 'Nomor kosong Shopee untuk membuat akun baru.', isActive: true, sortOrder: 2 },
  { id: 'nk-4', name: 'TikTok', logoUrl: '', description: 'Nomor kosong TikTok untuk registrasi.', isActive: true, sortOrder: 3 },
  { id: 'nk-5', name: 'Instagram', logoUrl: '', description: 'Nomor kosong Instagram untuk verifikasi.', isActive: true, sortOrder: 4 },
  { id: 'nk-6', name: 'Facebook', logoUrl: '', description: 'Nomor kosong Facebook untuk registrasi.', isActive: true, sortOrder: 5 },
  { id: 'nk-7', name: 'Gmail', logoUrl: '', description: 'Nomor kosong Gmail untuk verifikasi akun Google.', isActive: true, sortOrder: 6 },
  { id: 'nk-8', name: 'Discord', logoUrl: '', description: 'Nomor kosong Discord untuk verifikasi.', isActive: true, sortOrder: 7 },
];

const DEFAULT_COUNTRIES: NokosCountry[] = [
  // Telegram
  { id: 'nc-1', appId: 'nk-1', countryCode: 'ID', countryName: 'Indonesia', flagEmoji: '🇮🇩', price: 5000, stock: 15, description: 'Nomor +62, bisa SMS & panggilan.', isActive: true },
  { id: 'nc-2', appId: 'nk-1', countryCode: 'US', countryName: 'Amerika', flagEmoji: '🇺🇸', price: 7000, stock: 8, description: 'Nomor +1, bisa SMS.', isActive: true },
  { id: 'nc-3', appId: 'nk-1', countryCode: 'GB', countryName: 'Inggris', flagEmoji: '🇬🇧', price: 6000, stock: 0, description: 'Nomor +44, bisa SMS.', isActive: true },
  { id: 'nc-4', appId: 'nk-1', countryCode: 'MY', countryName: 'Malaysia', flagEmoji: '🇲🇾', price: 5000, stock: 20, description: 'Nomor +60, bisa SMS.', isActive: true },
  { id: 'nc-5', appId: 'nk-1', countryCode: 'SG', countryName: 'Singapura', flagEmoji: '🇸🇬', price: 8000, stock: 5, description: 'Nomor +65.', isActive: true },
  { id: 'nc-6', appId: 'nk-1', countryCode: 'JP', countryName: 'Jepang', flagEmoji: '🇯🇵', price: 9000, stock: 12, description: 'Nomor +81.', isActive: true },
  { id: 'nc-7', appId: 'nk-1', countryCode: 'IN', countryName: 'India', flagEmoji: '🇮🇳', price: 4000, stock: 0, description: 'Nomor +91.', isActive: true },
  { id: 'nc-8', appId: 'nk-1', countryCode: 'BR', countryName: 'Brazil', flagEmoji: '🇧🇷', price: 5000, stock: 3, description: 'Nomor +55.', isActive: true },
  { id: 'nc-9', appId: 'nk-1', countryCode: 'DE', countryName: 'Jerman', flagEmoji: '🇩🇪', price: 7000, stock: 7, description: 'Nomor +49.', isActive: true },
  // WhatsApp
  { id: 'nc-10', appId: 'nk-2', countryCode: 'ID', countryName: 'Indonesia', flagEmoji: '🇮🇩', price: 4000, stock: 20, description: 'Nomor +62, siap pakai WhatsApp.', isActive: true },
  { id: 'nc-11', appId: 'nk-2', countryCode: 'US', countryName: 'Amerika', flagEmoji: '🇺🇸', price: 6000, stock: 10, description: 'Nomor +1.', isActive: true },
  { id: 'nc-12', appId: 'nk-2', countryCode: 'MY', countryName: 'Malaysia', flagEmoji: '🇲🇾', price: 5000, stock: 8, description: 'Nomor +60.', isActive: true },
  // Shopee
  { id: 'nc-13', appId: 'nk-3', countryCode: 'ID', countryName: 'Indonesia', flagEmoji: '🇮🇩', price: 8000, stock: 5, description: 'Nomor +62 untuk Shopee.', isActive: true },
  { id: 'nc-14', appId: 'nk-3', countryCode: 'MY', countryName: 'Malaysia', flagEmoji: '🇲🇾', price: 9000, stock: 3, description: 'Nomor +60 untuk Shopee.', isActive: true },
  // TikTok
  { id: 'nc-15', appId: 'nk-4', countryCode: 'ID', countryName: 'Indonesia', flagEmoji: '🇮🇩', price: 6000, stock: 12, description: 'Nomor +62 untuk TikTok.', isActive: true },
  { id: 'nc-16', appId: 'nk-4', countryCode: 'US', countryName: 'Amerika', flagEmoji: '🇺🇸', price: 8000, stock: 6, description: 'Nomor +1 untuk TikTok.', isActive: true },
  // Instagram (all out of stock)
  { id: 'nc-17', appId: 'nk-5', countryCode: 'ID', countryName: 'Indonesia', flagEmoji: '🇮🇩', price: 7000, stock: 0, description: 'Nomor +62 untuk Instagram.', isActive: true },
  { id: 'nc-18', appId: 'nk-5', countryCode: 'US', countryName: 'Amerika', flagEmoji: '🇺🇸', price: 9000, stock: 0, description: 'Nomor +1 untuk Instagram.', isActive: true },
  // Facebook
  { id: 'nc-19', appId: 'nk-6', countryCode: 'ID', countryName: 'Indonesia', flagEmoji: '🇮🇩', price: 5000, stock: 8, description: 'Nomor +62 untuk Facebook.', isActive: true },
  { id: 'nc-20', appId: 'nk-6', countryCode: 'IN', countryName: 'India', flagEmoji: '🇮🇳', price: 4000, stock: 15, description: 'Nomor +91 untuk Facebook.', isActive: true },
  // Gmail
  { id: 'nc-21', appId: 'nk-7', countryCode: 'ID', countryName: 'Indonesia', flagEmoji: '🇮🇩', price: 4000, stock: 25, description: 'Nomor +62 untuk Gmail.', isActive: true },
  { id: 'nc-22', appId: 'nk-7', countryCode: 'US', countryName: 'Amerika', flagEmoji: '🇺🇸', price: 5000, stock: 18, description: 'Nomor +1 untuk Gmail.', isActive: true },
  // Discord
  { id: 'nc-23', appId: 'nk-8', countryCode: 'ID', countryName: 'Indonesia', flagEmoji: '🇮🇩', price: 5000, stock: 10, description: 'Nomor +62 untuk Discord.', isActive: true },
  { id: 'nc-24', appId: 'nk-8', countryCode: 'US', countryName: 'Amerika', flagEmoji: '🇺🇸', price: 6000, stock: 7, description: 'Nomor +1 untuk Discord.', isActive: true },
];

function getStockColor(stock: number) {
  if (stock === 0) return 'text-error';
  if (stock <= 3) return 'text-amber-500';
  return 'text-accent-green';
}

function getStockBg(stock: number) {
  if (stock === 0) return 'bg-error/10';
  if (stock <= 3) return 'bg-amber-500/10';
  return 'bg-accent-green/10';
}

export default function NokosPage() {
  const [apps, setApps] = useState<NokosApp[]>([]);
  const [countries, setCountries] = useState<NokosCountry[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);

  // Buy form
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buySuccess, setBuySuccess] = useState(false);

  useEffect(() => {
    const storedApps = localStorage.getItem('daya_nokos_apps');
    const storedCountries = localStorage.getItem('daya_nokos_countries');
    if (storedApps) {
      setApps(JSON.parse(storedApps));
    } else {
      setApps(DEFAULT_APPS);
      localStorage.setItem('daya_nokos_apps', JSON.stringify(DEFAULT_APPS));
    }
    if (storedCountries) {
      setCountries(JSON.parse(storedCountries));
    } else {
      setCountries(DEFAULT_COUNTRIES);
      localStorage.setItem('daya_nokos_countries', JSON.stringify(DEFAULT_COUNTRIES));
    }
  }, []);

  const activeApps = apps.filter(a => a.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const selectedApp = apps.find(a => a.id === selectedAppId) || null;
  const appCountries = countries.filter(c => c.appId === selectedAppId && c.isActive);
  const selectedCountry = countries.find(c => c.id === selectedCountryId) || null;

  const getCountryCount = useCallback((appId: string) => {
    return countries.filter(c => c.appId === appId && c.isActive).length;
  }, [countries]);

  const isAppOutOfStock = useCallback((appId: string) => {
    const appCs = countries.filter(c => c.appId === appId && c.isActive);
    return appCs.length > 0 && appCs.every(c => c.stock === 0);
  }, [countries]);

  const handleBuy = () => {
    if (!buyerName.trim() || !buyerPhone.trim() || !selectedCountry) return;
    // Decrease stock
    const updated = countries.map(c =>
      c.id === selectedCountry.id ? { ...c, stock: Math.max(0, c.stock - 1) } : c
    );
    setCountries(updated);
    localStorage.setItem('daya_nokos_countries', JSON.stringify(updated));

    // Save order to localStorage
    const orders = JSON.parse(localStorage.getItem('daya_orders') || '[]');
    const orderCode = `DM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    orders.push({
      id: crypto.randomUUID(),
      orderCode,
      productName: `Nokos ${selectedApp?.name} - ${selectedCountry.countryName}`,
      module: 'nokos',
      amount: selectedCountry.price,
      status: 'diproses',
      createdAt: new Date().toISOString(),
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
    });
    localStorage.setItem('daya_orders', JSON.stringify(orders));

    setBuySuccess(true);
    setTimeout(() => setBuySuccess(false), 5000);
    setBuyerName('');
    setBuyerPhone('');
  };

  /* ─── LEVEL 3: Detail & Beli ─── */
  if (selectedApp && selectedCountry) {
    const outOfStock = selectedCountry.stock === 0;
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-on-surface-variant flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
          <ChevronRight size={14} />
          <button onClick={() => { setSelectedAppId(null); setSelectedCountryId(null); }} className="hover:text-primary transition-colors">Nokos</button>
          <ChevronRight size={14} />
          <button onClick={() => setSelectedCountryId(null)} className="hover:text-primary transition-colors">{selectedApp.name}</button>
          <ChevronRight size={14} />
          <span className="text-primary font-semibold">{selectedCountry.countryName}</span>
        </nav>

        {/* Back */}
        <button onClick={() => setSelectedCountryId(null)}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Negara
        </button>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-soft overflow-hidden">
            <div className="gradient-primary p-6 flex items-center gap-4">
              <BrandImage src={selectedApp.logoUrl} alt={`Logo ${selectedApp.name}`} size={56} rounded={14} fallbackText={selectedApp.name} disabled={outOfStock} />
              <div className="text-white">
                <h1 className="text-xl font-bold font-[family-name:var(--font-heading)]">{selectedApp.name} — {selectedCountry.flagEmoji} {selectedCountry.countryName}</h1>
                <p className="text-sm text-white/70 mt-1">{selectedCountry.description || selectedApp.description}</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Price & Stock */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xs text-on-surface-variant mb-1">Harga</p>
                  <p className="text-3xl font-extrabold text-primary font-[family-name:var(--font-heading)]">{formatRupiah(selectedCountry.price)}</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStockBg(selectedCountry.stock)} ${getStockColor(selectedCountry.stock)}`}>
                  {outOfStock ? '❌ Stok Habis' : `✅ Tersedia: ${selectedCountry.stock}`}
                </div>
              </div>

              {/* Success Message */}
              {buySuccess && (
                <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4 text-sm text-accent-green font-semibold flex items-center gap-2 animate-fade-in">
                  <Package size={18} />
                  Pesanan berhasil! Admin akan menghubungi Anda via WhatsApp untuk mengirim nomor.
                </div>
              )}

              {/* Form */}
              {!outOfStock && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Nama Lengkap *</label>
                    <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)}
                      placeholder="Masukkan nama Anda"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">No. WhatsApp *</label>
                    <input type="tel" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                  </div>
                  <button onClick={handleBuy}
                    disabled={!buyerName.trim() || !buyerPhone.trim()}
                    className="w-full py-3.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <MessageCircle size={18} />
                    Beli Sekarang — {formatRupiah(selectedCountry.price)}
                  </button>
                </div>
              )}

              {outOfStock && (
                <button disabled
                  className="w-full py-3.5 rounded-full bg-gray-300 text-gray-500 font-semibold text-sm cursor-not-allowed">
                  Stok Habis
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── LEVEL 2: Daftar Negara ─── */
  if (selectedApp) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-on-surface-variant flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
          <ChevronRight size={14} />
          <button onClick={() => setSelectedAppId(null)} className="hover:text-primary transition-colors">Nokos</button>
          <ChevronRight size={14} />
          <span className="text-primary font-semibold">{selectedApp.name}</span>
        </nav>

        {/* Back */}
        <button onClick={() => setSelectedAppId(null)}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Aplikasi
        </button>

        {/* Header */}
        <div className="flex items-center gap-4">
          <BrandImage src={selectedApp.logoUrl} alt={`Logo ${selectedApp.name}`} size={48} rounded={12} fallbackText={selectedApp.name} />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-on-surface font-[family-name:var(--font-heading)]">{selectedApp.name} — Pilih Negara</h1>
            <p className="text-sm text-on-surface-variant mt-1">{appCountries.length} negara tersedia</p>
          </div>
        </div>

        {/* Grid Negara */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {appCountries.map(country => {
            const out = country.stock === 0;
            return (
              <button
                key={country.id}
                onClick={() => !out && setSelectedCountryId(country.id)}
                disabled={out}
                className={`relative bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-soft overflow-hidden flex flex-col items-center p-5 text-center transition-all ${out ? 'opacity-60 cursor-not-allowed' : 'shadow-hover-effect cursor-pointer hover:border-primary/40'}`}
              >
                {/* Flag */}
                <span className="text-4xl mb-3">{country.flagEmoji}</span>
                <h3 className="font-semibold text-base text-on-surface">{country.countryName}</h3>
                <p className={`text-sm font-semibold mt-1 ${getStockColor(country.stock)}`}>
                  {out ? 'HABIS' : `Stok: ${country.stock}`}
                </p>
                <p className="text-sm font-bold text-primary mt-2 font-[family-name:var(--font-heading)]">{formatRupiah(country.price)}</p>

                {/* Out of stock overlay */}
                {out && (
                  <div className="absolute inset-0 bg-gray-900/30 flex items-center justify-center rounded-2xl">
                    <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full">Stok Habis</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {appCountries.length === 0 && (
          <div className="text-center py-16 text-on-surface-variant">
            <Package size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">Belum ada negara untuk aplikasi ini.</p>
          </div>
        )}
      </div>
    );
  }

  /* ─── LEVEL 1: Daftar Aplikasi ─── */
  return (
    <div className="space-y-8 animate-fade-in">
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">Nokos</span>
      </nav>

      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
          <ShieldCheck size={28} /> Nomor Kosong (Nokos)
        </h1>
        <p className="text-sm text-on-surface-variant mt-2">Pilih aplikasi untuk melihat negara yang tersedia.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {activeApps.map(app => {
          const countryCount = getCountryCount(app.id);
          const outOfStock = isAppOutOfStock(app.id);
          return (
            <button
              key={app.id}
              onClick={() => setSelectedAppId(app.id)}
              className={`relative bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-soft overflow-hidden flex flex-col items-center p-5 text-center transition-all ${outOfStock ? 'opacity-60' : 'shadow-hover-effect hover:border-primary/40'}`}
            >
              <BrandImage
                src={app.logoUrl}
                alt={`Logo ${app.name}`}
                size={48}
                rounded={12}
                disabled={outOfStock}
                fallbackText={app.name}
              />
              <h3 className="font-bold text-base text-on-surface mt-3">{app.name}</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                {countryCount} negara tersedia
              </p>

              {outOfStock && (
                <span className="mt-2 inline-block bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Stok Habis
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeApps.length === 0 && (
        <div className="text-center py-16 text-on-surface-variant">
          <ShieldCheck size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">Belum ada aplikasi nokos yang tersedia.</p>
        </div>
      )}
    </div>
  );
}
