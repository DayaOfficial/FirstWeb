'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronRight, ShoppingCart, Info, Zap, ShieldCheck,
  ArrowDown, ArrowUp, Camera, Play, Music, Hash,
  ThumbsUp, Send, Headphones
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { cn } from '@/lib/utils';

/* ─── Platform Data ─── */
const platforms = [
  { id: 'instagram', label: 'Instagram', icon: Camera, color: 'text-pink-500' },
  { id: 'youtube', label: 'YouTube', icon: Play, color: 'text-red-500' },
  { id: 'tiktok', label: 'TikTok', icon: Music, color: 'text-on-surface' },
  { id: 'twitter', label: 'Twitter (X)', icon: Hash, color: 'text-tertiary' },
  { id: 'facebook', label: 'Facebook', icon: ThumbsUp, color: 'text-blue-600' },
  { id: 'telegram', label: 'Telegram', icon: Send, color: 'text-sky-500' },
  { id: 'spotify', label: 'Spotify', icon: Headphones, color: 'text-green-500' },
];

/* ─── Service Data with Servers ─── */
const services = [
  // Instagram
  { id: 1, platform: 'instagram', name: 'Followers', server: 'Server 1', quality: 'High Quality', price: 15000, min: 100, max: 50000, speed: '1K - 5K per hari', guarantee: 'Garansi 30 Hari', desc: 'Real & Aktif' },
  { id: 2, platform: 'instagram', name: 'Followers', server: 'Server 2', quality: 'Fast Start', price: 12000, min: 100, max: 100000, speed: '5K - 10K per hari', guarantee: 'Garansi 7 Hari', desc: 'Mix Quality' },
  { id: 3, platform: 'instagram', name: 'Likes Post', server: 'Server 1', quality: 'High Quality', price: 5000, min: 50, max: 10000, speed: '1K - 3K per hari', guarantee: 'Tanpa Garansi', desc: 'Real & Aktif' },
  { id: 4, platform: 'instagram', name: 'Likes Post', server: 'Server 2', quality: 'Fast', price: 3000, min: 50, max: 50000, speed: '5K - 10K per hari', guarantee: 'Tanpa Garansi', desc: 'Mix Quality' },
  { id: 5, platform: 'instagram', name: 'Views Reels', server: 'Server 1', quality: 'Instant', price: 2000, min: 100, max: 100000, speed: '10K+ per hari', guarantee: 'Tanpa Garansi', desc: 'Fast Delivery' },
  { id: 6, platform: 'instagram', name: 'Comments', server: 'Server 1', quality: 'Custom', price: 25000, min: 10, max: 1000, speed: '100 - 500 per hari', guarantee: 'Tanpa Garansi', desc: 'Real Account' },
  // YouTube
  { id: 7, platform: 'youtube', name: 'Subscribers', server: 'Server 1', quality: 'High Quality', price: 50000, min: 100, max: 10000, speed: '100 - 500 per hari', guarantee: 'Garansi 30 Hari', desc: 'Real & Aktif' },
  { id: 8, platform: 'youtube', name: 'Views Video', server: 'Server 1', quality: 'High Retention', price: 15000, min: 500, max: 100000, speed: '1K - 5K per hari', guarantee: 'Tanpa Garansi', desc: 'Retention Tinggi' },
  { id: 9, platform: 'youtube', name: 'Views Video', server: 'Server 2', quality: 'Fast', price: 8000, min: 500, max: 1000000, speed: '10K+ per hari', guarantee: 'Tanpa Garansi', desc: 'Worldwide Views' },
  { id: 10, platform: 'youtube', name: 'Likes Video', server: 'Server 1', quality: 'High Quality', price: 20000, min: 50, max: 10000, speed: '500 - 1K per hari', guarantee: 'Garansi 7 Hari', desc: 'Real & Aktif' },
  // TikTok
  { id: 11, platform: 'tiktok', name: 'Followers', server: 'Server 1', quality: 'High Quality', price: 20000, min: 100, max: 50000, speed: '1K - 3K per hari', guarantee: 'Garansi 30 Hari', desc: 'Real & Aktif' },
  { id: 12, platform: 'tiktok', name: 'Likes Video', server: 'Server 1', quality: 'Fast', price: 10000, min: 50, max: 50000, speed: '5K - 10K per hari', guarantee: 'Tanpa Garansi', desc: 'Mix Quality' },
  { id: 13, platform: 'tiktok', name: 'Views Video', server: 'Server 1', quality: 'Instant', price: 5000, min: 500, max: 1000000, speed: '10K+ per hari', guarantee: 'Tanpa Garansi', desc: 'Fast Delivery' },
  { id: 14, platform: 'tiktok', name: 'Share', server: 'Server 1', quality: 'Fast', price: 8000, min: 100, max: 10000, speed: '1K - 5K per hari', guarantee: 'Tanpa Garansi', desc: 'Fast Delivery' },
  // Twitter
  { id: 15, platform: 'twitter', name: 'Followers', server: 'Server 1', quality: 'High Quality', price: 30000, min: 100, max: 10000, speed: '500 - 1K per hari', guarantee: 'Garansi 30 Hari', desc: 'Real & Aktif' },
  { id: 16, platform: 'twitter', name: 'Likes Tweet', server: 'Server 1', quality: 'Fast', price: 12000, min: 50, max: 10000, speed: '1K - 3K per hari', guarantee: 'Tanpa Garansi', desc: 'Mix Quality' },
  { id: 17, platform: 'twitter', name: 'Retweet', server: 'Server 1', quality: 'Fast', price: 15000, min: 50, max: 5000, speed: '500 - 1K per hari', guarantee: 'Tanpa Garansi', desc: 'Mix Quality' },
  // Facebook
  { id: 18, platform: 'facebook', name: 'Page Likes', server: 'Server 1', quality: 'High Quality', price: 35000, min: 100, max: 10000, speed: '500 - 1K per hari', guarantee: 'Garansi 30 Hari', desc: 'Real & Aktif' },
  { id: 19, platform: 'facebook', name: 'Post Likes', server: 'Server 1', quality: 'Fast', price: 8000, min: 50, max: 10000, speed: '1K - 5K per hari', guarantee: 'Tanpa Garansi', desc: 'Mix Quality' },
  // Telegram
  { id: 20, platform: 'telegram', name: 'Members Channel', server: 'Server 1', quality: 'High Quality', price: 18000, min: 100, max: 50000, speed: '1K - 3K per hari', guarantee: 'Garansi 7 Hari', desc: 'Real Account' },
  { id: 21, platform: 'telegram', name: 'Members Group', server: 'Server 1', quality: 'Fast', price: 15000, min: 100, max: 50000, speed: '3K - 5K per hari', guarantee: 'Tanpa Garansi', desc: 'Mix Quality' },
  // Spotify
  { id: 22, platform: 'spotify', name: 'Plays', server: 'Server 1', quality: 'Premium', price: 12000, min: 1000, max: 100000, speed: '1K - 5K per hari', guarantee: 'Tanpa Garansi', desc: 'Worldwide Plays' },
  { id: 23, platform: 'spotify', name: 'Followers', server: 'Server 1', quality: 'High Quality', price: 25000, min: 100, max: 10000, speed: '500 - 1K per hari', guarantee: 'Garansi 30 Hari', desc: 'Real & Aktif' },
];

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

export default function SmmPanelPage() {
  const [activePlatform, setActivePlatform] = useState('instagram');
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [targetLink, setTargetLink] = useState('');
  const [quantity, setQuantity] = useState(1000);

  // Filter services for selected platform
  const filteredServices = useMemo(
    () => services.filter(s => s.platform === activePlatform),
    [activePlatform]
  );

  // Auto-select first service when platform changes
  const selectedService = useMemo(() => {
    if (selectedServiceId) {
      const found = filteredServices.find(s => s.id === selectedServiceId);
      if (found) return found;
    }
    return filteredServices[0] || null;
  }, [filteredServices, selectedServiceId]);

  // Price calculation
  const pricePerK = selectedService?.price || 0;
  const totalPrice = Math.ceil((quantity / 1000) * pricePerK);

  // Reset service when platform changes
  const handlePlatformChange = (platformId: string) => {
    setActivePlatform(platformId);
    setSelectedServiceId(null);
  };

  const activePlatformData = platforms.find(p => p.id === activePlatform);

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">Sosial Media</span>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)]">
          Sosial Media (SMM Panel)
        </h1>
        <p className="text-sm text-on-surface-variant mt-2 max-w-2xl">
          Buat pesanan baru untuk layanan sosial media. Pilih platform, layanan, dan masukkan data pesanan.
        </p>
      </div>

      {/* Order Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Section */}
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1: Pilih Kategori */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-soft">
            <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-3 font-[family-name:var(--font-heading)]">
              <span className="w-8 h-8 rounded-full gradient-primary text-white flex items-center justify-center text-sm font-bold shrink-0">1</span>
              Pilih Kategori
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {platforms.map(p => {
                const Icon = p.icon;
                const isActive = activePlatform === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePlatformChange(p.id)}
                    className={cn(
                      'flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 group',
                      isActive
                        ? 'border-2 border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border border-outline-variant/50 hover:border-primary/40 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                    )}
                  >
                    <Icon size={28} className={cn('mb-2 transition-colors', isActive ? 'text-primary' : p.color)} />
                    <span className={cn('font-semibold text-xs', isActive && 'text-primary')}>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Pilih Layanan */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-soft">
            <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-3 font-[family-name:var(--font-heading)]">
              <span className="w-8 h-8 rounded-full gradient-primary text-white flex items-center justify-center text-sm font-bold shrink-0">2</span>
              Pilih Layanan
            </h3>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="service-select">
                Layanan Tersedia — {activePlatformData?.label}
              </label>
              <div className="relative">
                <select
                  id="service-select"
                  value={selectedService?.id || ''}
                  onChange={e => setSelectedServiceId(Number(e.target.value))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 pr-10 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                >
                  {filteredServices.map(s => (
                    <option key={s.id} value={s.id}>
                      {activePlatformData?.label} {s.name} - {s.server} [{s.quality}] - Rp {fmt(s.price)}/1K
                    </option>
                  ))}
                </select>
                <ChevronRight size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none rotate-90" />
              </div>
            </div>
          </div>

          {/* Step 3: Input Data */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-soft">
            <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-3 font-[family-name:var(--font-heading)]">
              <span className="w-8 h-8 rounded-full gradient-primary text-white flex items-center justify-center text-sm font-bold shrink-0">3</span>
              Input Data
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="target-link">
                  Link Target / Username
                </label>
                <input
                  id="target-link"
                  type="text"
                  value={targetLink}
                  onChange={e => setTargetLink(e.target.value)}
                  placeholder={`Contoh: https://${activePlatformData?.label.toLowerCase()}.com/username atau username`}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="quantity">
                  Jumlah (Quantity)
                </label>
                <input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  min={selectedService?.min || 100}
                  max={selectedService?.max || 50000}
                  placeholder={`Minimal: ${selectedService?.min || 100}`}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                {selectedService && (
                  <p className="text-xs text-on-surface-variant mt-1.5">
                    Min: {fmt(selectedService.min)} — Max: {fmt(selectedService.max)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="lg:sticky lg:top-24 space-y-6">

          {/* Order Summary */}
          <div className="bg-primary/3 rounded-2xl border border-primary/15 p-6 shadow-soft">
            <h3 className="text-lg font-bold text-on-surface mb-5 font-[family-name:var(--font-heading)]">
              Ringkasan Pesanan
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Platform</span>
                <span className="font-semibold text-on-surface">{activePlatformData?.label}</span>
              </div>
              {selectedService && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Layanan</span>
                  <span className="font-semibold text-on-surface text-right max-w-[160px] truncate">{selectedService.name}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Harga per 1.000</span>
                <span className="font-semibold text-on-surface">{formatRupiah(pricePerK)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Jumlah Pesanan</span>
                <span className="font-semibold text-on-surface">{fmt(quantity)}</span>
              </div>
              <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-center">
                <span className="font-bold text-on-surface">Total Harga</span>
                <span className="text-xl font-bold text-primary font-[family-name:var(--font-heading)]">
                  {formatRupiah(totalPrice)}
                </span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="w-full gradient-primary text-white py-3 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              Beli Sekarang
            </Link>
          </div>

          {/* Service Information */}
          {selectedService && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-soft">
              <h3 className="font-semibold text-sm text-on-surface mb-4 flex items-center gap-2">
                <Info size={18} className="text-primary" />
                Informasi Layanan
              </h3>
              <ul className="space-y-3 text-sm text-on-surface-variant">
                <li className="flex gap-2.5 items-start">
                  <Zap size={16} className="text-tertiary shrink-0 mt-0.5" />
                  <span><strong className="text-on-surface">Kecepatan:</strong> {selectedService.speed}</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <ShieldCheck size={16} className="text-tertiary shrink-0 mt-0.5" />
                  <span><strong className="text-on-surface">Kualitas:</strong> {selectedService.desc} ({selectedService.guarantee})</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <ArrowDown size={16} className="text-tertiary shrink-0 mt-0.5" />
                  <span><strong className="text-on-surface">Minimal Pesan:</strong> {fmt(selectedService.min)}</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <ArrowUp size={16} className="text-tertiary shrink-0 mt-0.5" />
                  <span><strong className="text-on-surface">Maksimal Pesan:</strong> {fmt(selectedService.max)}</span>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-error/5 border border-error/10 rounded-lg text-xs text-error font-medium">
                ⚠️ Pastikan akun tidak diprivate saat proses berlangsung!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
