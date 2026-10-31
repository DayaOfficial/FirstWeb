'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, ArrowLeft, Package, MessageCircle, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import BrandImage from '@/components/ui/BrandImage';
import { createClient } from '@/lib/supabase/client';
import type { NokosApp, NokosCountry } from '@/types';

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

  // Buy flow (no name/WA input — buyer fills via WhatsApp)
  const [showConfirm, setShowConfirm] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [formatText, setFormatText] = useState('');
  const [copied, setCopied] = useState(false);
  const [ownerWA, setOwnerWA] = useState('6287800001232');

  // Load from Supabase
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: appsData } = await supabase.from('nokos_apps').select('*').eq('is_active', true).order('sort_order');
      const { data: countriesData } = await supabase.from('nokos_countries').select('*').eq('is_active', true).order('country_name');

      if (appsData) {
        setApps(appsData.map((a: Record<string, unknown>) => ({
          id: a.id as string, name: a.name as string, logoUrl: (a.logo_url as string) || '',
          description: (a.description as string) || '', isActive: true, sortOrder: (a.sort_order as number) || 0
        })));
      }

      if (countriesData) {
        setCountries(countriesData.map((c: Record<string, unknown>) => ({
          id: c.id as string, appId: c.app_id as string, countryCode: c.country_code as string,
          countryName: c.country_name as string, flagEmoji: (c.flag_emoji as string) || '',
          price: Number(c.price), stock: c.stock as number, description: (c.description as string) || '', isActive: true
        })));
      }

      // Load owner WA
      const { data: waData } = await supabase.from('settings').select('value').eq('key', 'owner_whatsapp').single();
      if (waData?.value) setOwnerWA(waData.value);
    };
    loadData();
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

  const handleConfirmBuy = async () => {
    if (!selectedCountry || !selectedApp) return;

    const supabase = createClient();
    const newStock = Math.max(0, selectedCountry.stock - 1);
    await supabase.from('nokos_countries').update({ stock: newStock }).eq('id', selectedCountry.id);
    setCountries(prev => prev.map(c => c.id === selectedCountry.id ? { ...c, stock: newStock } : c));

    const orderCode = `DM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    await supabase.from('orders').insert({
      order_code: orderCode,
      product_name: `Nokos ${selectedApp.name} - ${selectedCountry.countryName}`,
      module: 'nokos',
      amount: selectedCountry.price,
      process_status: 'waiting',
      payment_status: 'pending',
    });

    // Load message template
    const { data: tmpl } = await supabase
      .from('message_templates')
      .select('content')
      .eq('template_key', 'nokos')
      .single();

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    let text = tmpl?.content || `Halo! Saya ingin order Nokos.\n\nOrder: Nokos {aplikasi} - {negara}\nOrder ID: {order_id}\nHarga: {harga}\nTanggal: ${dateStr}\n\nNama: (isi nama Anda)\nNo. WA: (isi nomor Anda)`;
    text = text
      .replace(/{order_id}/g, orderCode)
      .replace(/{aplikasi}/g, selectedApp.name)
      .replace(/{negara}/g, `${selectedCountry.flagEmoji} ${selectedCountry.countryName}`)
      .replace(/{harga}/g, formatRupiah(selectedCountry.price))
      .replace(/{nama}/g, '............')
      .replace(/{nomor}/g, '(akan dikirim admin)');

    setFormatText(text);
    setOrderDone(true);
    setShowConfirm(false);
  };

  const copyFormat = () => {
    navigator.clipboard.writeText(formatText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToWhatsApp = () => {
    const url = `https://wa.me/${ownerWA}?text=${encodeURIComponent(formatText)}`;
    window.open(url, '_blank');
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
          <button onClick={() => { setSelectedAppId(null); setSelectedCountryId(null); setOrderDone(false); }} className="hover:text-primary transition-colors">Nokos</button>
          <ChevronRight size={14} />
          <button onClick={() => { setSelectedCountryId(null); setOrderDone(false); }} className="hover:text-primary transition-colors">{selectedApp.name}</button>
          <ChevronRight size={14} />
          <span className="text-primary font-semibold">{selectedCountry.countryName}</span>
        </nav>

        {/* Back */}
        <button onClick={() => { setSelectedCountryId(null); setOrderDone(false); }}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Negara
        </button>

        <div className="max-w-2xl mx-auto">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-soft overflow-hidden">
            {/* Header */}
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

              {/* ── ORDER DONE: Format Pesan ── */}
              {orderDone && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4 text-sm text-accent-green font-semibold flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    Pesanan tercatat! Salin format di bawah & kirim ke WhatsApp owner.
                  </div>

                  {/* Format text box */}
                  <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4">
                    <p className="text-xs text-on-surface-variant font-semibold mb-2">📋 Format Pesan:</p>
                    <pre className="text-sm text-on-surface whitespace-pre-wrap font-sans leading-relaxed">{formatText}</pre>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={copyFormat}
                      className="flex-1 py-3 rounded-full border-2 border-primary text-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors">
                      {copied ? <><CheckCircle2 size={16} /> Tersalin!</> : <><Copy size={16} /> Salin Format</>}
                    </button>
                    <button onClick={goToWhatsApp}
                      className="flex-1 py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2">
                      <MessageCircle size={16} /> Lanjut ke WhatsApp
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── CONFIRM DIALOG ── */}
              {showConfirm && !orderDone && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4 animate-fade-in">
                  <p className="text-sm font-semibold text-amber-800">⚠️ Konfirmasi Pesanan</p>
                  <div className="text-sm text-amber-700 space-y-1">
                    <p>Aplikasi: <strong>{selectedApp.name}</strong></p>
                    <p>Negara: <strong>{selectedCountry.flagEmoji} {selectedCountry.countryName}</strong></p>
                    <p>Total: <strong className="text-primary">{formatRupiah(selectedCountry.price)}</strong></p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowConfirm(false)}
                      className="flex-1 py-2.5 rounded-full border border-outline-variant text-on-surface-variant font-semibold text-sm hover:bg-surface-container-high transition-colors">
                      Batal
                    </button>
                    <button onClick={handleConfirmBuy}
                      className="flex-1 py-2.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all">
                      Konfirmasi & Pesan
                    </button>
                  </div>
                </div>
              )}

              {/* ── BUY BUTTON (initial state) ── */}
              {!outOfStock && !showConfirm && !orderDone && (
                <button onClick={() => setShowConfirm(true)}
                  className="w-full py-3.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <MessageCircle size={18} />
                  Pesan Sekarang — {formatRupiah(selectedCountry.price)}
                </button>
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
        <nav className="flex items-center gap-2 text-sm text-on-surface-variant flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
          <ChevronRight size={14} />
          <button onClick={() => setSelectedAppId(null)} className="hover:text-primary transition-colors">Nokos</button>
          <ChevronRight size={14} />
          <span className="text-primary font-semibold">{selectedApp.name}</span>
        </nav>

        <button onClick={() => setSelectedAppId(null)}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Aplikasi
        </button>

        <div className="flex items-center gap-4">
          <BrandImage src={selectedApp.logoUrl} alt={`Logo ${selectedApp.name}`} size={48} rounded={12} fallbackText={selectedApp.name} />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-on-surface font-[family-name:var(--font-heading)]">{selectedApp.name} — Pilih Negara</h1>
            <p className="text-sm text-on-surface-variant mt-1">{appCountries.length} negara tersedia</p>
          </div>
        </div>

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
                <span className="text-4xl mb-3">{country.flagEmoji}</span>
                <h3 className="font-semibold text-base text-on-surface">{country.countryName}</h3>
                <p className={`text-sm font-semibold mt-1 ${getStockColor(country.stock)}`}>
                  {out ? 'HABIS' : `Stok: ${country.stock}`}
                </p>
                <p className="text-sm font-bold text-primary mt-2 font-[family-name:var(--font-heading)]">{formatRupiah(country.price)}</p>

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
