'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCheckout } from '@/hooks/use-checkout';
import { formatRupiah } from '@/lib/utils';
import ConfirmationStep from '@/components/checkout/confirmation-step';
import PaymentStep from '@/components/checkout/payment-step';
import {
  Search, Globe, ChevronDown, RotateCcw, ShoppingCart, Loader2,
  ExternalLink, Info, Hash, Zap,
} from 'lucide-react';

/* ===== TYPES ===== */
interface SMMProduct {
  id: string;
  name: string;
  brand: string;
  price_sell: number;
  provider_code: string;
  description: string;
  min_qty: number;
  max_qty: number;
  smm_category: string;
  platform_icon_url: string | null;
  is_refillable?: boolean;
  refill_days?: number;
  service_type?: string;
}

/* ===== PLATFORM BRAND COLORS ===== */
const PLATFORM_COLORS: Record<string, string> = {
  'All': '#8B5CF6',
  'Instagram': '#E4405F',
  'Facebook': '#1877F2',
  'Youtube': '#FF0000',
  'Twitter': '#1DA1F2',
  'Tiktok': '#000000',
  'Spotify': '#1DB954',
  'Telegram': '#26A5E4',
  'Google': '#4285F4',
  'Twitch': '#9146FF',
  'Discord': '#5865F2',
  'Website': '#06B6D4',
  'Whatsapp': '#25D366',
  'Shopee': '#EE4D2D',
  'Threads': '#000000',
  'Linkedin': '#0A66C2',
  'Pinterest': '#E60023',
  'Snackvideo': '#FBBF24',
  'Roblox': '#E2231A',
  'Soundcloud': '#FF5500',
  'Reddit': '#FF4500',
  'Snapchat': '#FFFC00',
  'Line': '#06C755',
  'Gmail': '#EA4335',
  'Tokopedia': '#42B549',
  'Lazada': '#0F146D',
  'Lainnya': '#6366F1',
};

/* ===== Platform Icon Component ===== */
function PlatformIcon({ name, iconUrl, size = 20, isActive = false }: { name: string; iconUrl?: string | null; size?: number; isActive?: boolean }) {
  // If owner uploaded a custom icon, use it
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-md object-contain"
        style={{ width: size, height: size }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }

  // Styled circle with initial letter and brand color
  const color = PLATFORM_COLORS[name] || '#6366F1';
  const initial = name === 'All' ? '≡' : name.charAt(0).toUpperCase();

  return (
    <div
      className="flex items-center justify-center rounded-lg font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        background: isActive ? 'rgba(255,255,255,0.25)' : color,
        boxShadow: isActive ? 'none' : `0 2px 8px ${color}40`,
      }}
    >
      {initial}
    </div>
  );
}

/* ===== PAGE ===== */
export default function SMMPanelPage() {
  const supabase = createClient();
  const { state, go, actions } = useCheckout({ name: 'SMM Panel', needs_target: false });

  // Data
  const [products, setProducts] = useState<SMMProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activePlatform, setActivePlatform] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');

  // Order form
  const [target, setTarget] = useState('');
  const [quantity, setQuantity] = useState('');
  const [ordering, setOrdering] = useState(false);

  // Load produk SMM — live-fetch dari SprintPedia API (seperti bot Telegram),
  // lalu fallback ke database jika API gagal.
  useEffect(() => {
    (async () => {
      // 1) Live-fetch dari SprintPedia API (mirrors bot's fetchSprintServices)
      try {
        const res = await fetch('/api/store/smm-live');
        const json = await res.json();
        if (json.services && json.services.length > 0) {
          setProducts(json.services as SMMProduct[]);
          setLoading(false);
          return;
        }
      } catch { /* silent — fallback below */ }

      // 2) Fallback: database (synced products)
      const { data } = await supabase
        .from('products')
        .select('id, name, brand, price_sell, provider_code, description, min_qty, max_qty, smm_category, platform_icon_url, is_refillable, refill_days, service_type')
        .eq('module', 'sprintpedia')
        .eq('is_active', true)
        .order('brand', { ascending: true });

      if (data && data.length > 0) {
        setProducts(data as SMMProduct[]);
        setLoading(false);
        return;
      }

      // 3) Final fallback: old API route
      try {
        const res = await fetch('/api/store/smm-services');
        const json = await res.json();
        setProducts((json.services || []) as SMMProduct[]);
      } catch { /* silent */ }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Derived data ===

  // Unique platforms with icon URLs
  const platformsData = useMemo(() => {
    const map = new Map<string, string | null>();
    products.forEach(p => {
      if (!map.has(p.brand)) {
        map.set(p.brand, p.platform_icon_url || null);
      } else if (!map.get(p.brand) && p.platform_icon_url) {
        map.set(p.brand, p.platform_icon_url);
      }
    });
    const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return [{ name: 'All', iconUrl: null }, ...sorted.map(([name, iconUrl]) => ({ name, iconUrl }))];
  }, [products]);

  // Products filtered by platform & search
  const filteredByPlatform = useMemo(() => {
    let list = products;
    if (activePlatform !== 'All') {
      list = list.filter(p => p.brand === activePlatform);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.provider_code.includes(q) ||
        p.smm_category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activePlatform, searchQuery]);

  // Categories for the filtered products
  const categories = useMemo(() => {
    const set = new Set<string>();
    filteredByPlatform.forEach(p => {
      if (p.smm_category) set.add(p.smm_category);
    });
    return Array.from(set).sort();
  }, [filteredByPlatform]);

  // Services for the selected category
  const services = useMemo(() => {
    if (!selectedCategory) return filteredByPlatform;
    return filteredByPlatform.filter(p => p.smm_category === selectedCategory);
  }, [filteredByPlatform, selectedCategory]);

  // Selected service object
  const selectedService = useMemo(() => {
    return products.find(p => p.id === selectedServiceId) || null;
  }, [products, selectedServiceId]);

  // Price calculation
  const totalPrice = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const qty = parseInt(quantity) || 0;
    // price_sell is per 1000
    return Math.round((selectedService.price_sell / 1000) * qty);
  }, [selectedService, quantity]);

  // Reset form
  const handleReset = () => {
    setActivePlatform('All');
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedServiceId('');
    setTarget('');
    setQuantity('');
  };

  // When platform changes, reset category & service
  const handlePlatformChange = (p: string) => {
    setActivePlatform(p);
    setSelectedCategory('');
    setSelectedServiceId('');
  };

  // When category changes, reset service
  const handleCategoryChange = (c: string) => {
    setSelectedCategory(c);
    setSelectedServiceId('');
  };

  // Submit order
  const handleSubmit = async () => {
    if (!selectedService || !target || !quantity) return;

    const qty = parseInt(quantity) || 0;
    if (qty < selectedService.min_qty || qty > selectedService.max_qty) {
      alert(`Jumlah harus antara ${selectedService.min_qty.toLocaleString()} - ${selectedService.max_qty.toLocaleString()}`);
      return;
    }

    setOrdering(true);
    try {
      go({
        product: {
          name: `SMM — ${selectedService.name}`,
          needs_target: true,
          category: 'SMM',
        },
        nominal: {
          name: `${selectedService.name} (${qty.toLocaleString()})`,
          price: totalPrice,
          price_sell: totalPrice,
          provider_code: selectedService.provider_code,
        },
        quantity: qty,
        targetInput: target,
        step: 'confirm' as const,
      });
    } catch {
      alert('Gagal membuat pesanan');
    }
    setOrdering(false);
  };

  // === RENDER ===
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  // === CONFIRMATION STEP ===
  if (state.step === 'confirm') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
            <a href="/" className="hover:text-primary transition-colors">Beranda</a>
            <span>›</span>
            <a href="/smm-panel" className="hover:text-primary transition-colors">Sosial Media</a>
            <span>›</span>
            <span className="text-primary font-semibold">Konfirmasi</span>
          </div>
        </div>
        <ConfirmationStep
          state={state}
          onConfirm={() => actions.confirmAndPay()}
          onBack={() => go({ step: 'input' })}
        />
      </div>
    );
  }

  // === PAYMENT STEP ===
  if (state.step === 'payment') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
            <a href="/" className="hover:text-primary transition-colors">Beranda</a>
            <span>›</span>
            <a href="/smm-panel" className="hover:text-primary transition-colors">Sosial Media</a>
            <span>›</span>
            <span className="text-primary font-semibold">Pembayaran</span>
          </div>
        </div>
        <PaymentStep
          orderId={state.orderId}
          qrisUrl={state.qrisUrl}
          qrString={state.qrString}
          testMode={state.testMode}
          amount={state.nominal?.price_sell || state.nominal?.price || 0}
          productName={state.product?.name || 'SMM Panel'}
        />
      </div>
    );
  }

  // === MAIN FORM ===
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
          <a href="/" className="hover:text-primary transition-colors">Beranda</a>
          <span>›</span>
          <span className="text-primary font-semibold">Sosial Media</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-on-surface font-[family-name:var(--font-heading)]">
          Sosial Media (SMM Panel)
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Boost sosial media kamu — followers, likes, views, comments & lainnya.
        </p>
      </div>

      {/* ═══════ PLATFORM GRID ═══════ */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-soft border border-outline-variant/20">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {platformsData.map(p => (
            <button
              key={p.name}
              onClick={() => handlePlatformChange(p.name)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer
                ${activePlatform === p.name
                  ? 'bg-primary text-white shadow-md scale-[1.02]'
                  : 'bg-surface-container-low text-on-surface hover:bg-primary/10 hover:text-primary border border-outline-variant/20'
                }`}
            >
              <PlatformIcon name={p.name} iconUrl={p.iconUrl} size={22} isActive={activePlatform === p.name} />
              <span className="truncate">{p.name}</span>
              {activePlatform === p.name && p.name === 'All' && (
                <span className="ml-auto text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                  {products.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ FORM ═══════ */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-soft border border-outline-variant/20 space-y-5">

        {/* Search */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
            Search
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari ID atau nama layanan..."
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
            Category *
          </label>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => handleCategoryChange(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 px-4 pr-10 text-sm appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              <option value="">— Pilih kategori —</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
          </div>
        </div>

        {/* Service */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
            Service *
          </label>
          <div className="relative">
            <select
              value={selectedServiceId}
              onChange={e => setSelectedServiceId(e.target.value)}
              disabled={services.length === 0}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 px-4 pr-10 text-sm appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="">
                {services.length === 0 ? 'Pilih kategori terlebih dahulu' : '— Pilih layanan —'}
              </option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.provider_code} - {s.name} {s.is_refillable ? `~ Refill ${s.refill_days || ''}Days` : '~ No Refill'} ~ Min {s.min_qty.toLocaleString()} ~ Max {s.max_qty.toLocaleString()} - ({formatRupiah(s.price_sell)}/1K)
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
          </div>

          {/* Service description */}
          {selectedService && (
            <div className="mt-2 p-3 bg-primary/5 border border-primary/15 rounded-xl text-xs text-on-surface-variant space-y-1 animate-fade-in">
              <div className="flex items-start gap-1.5">
                <Info size={12} className="shrink-0 mt-0.5 text-primary" />
                <span>{selectedService.description || 'Tidak ada deskripsi.'}</span>
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <span className="inline-flex items-center gap-1">
                  <Hash size={10} /> ID: <strong>{selectedService.provider_code}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Zap size={10} /> Min: <strong>{selectedService.min_qty.toLocaleString()}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Zap size={10} /> Max: <strong>{selectedService.max_qty.toLocaleString()}</strong>
                </span>
                {selectedService.is_refillable && (
                  <span className="inline-flex items-center gap-1 text-green-600">
                    ✅ Refill {selectedService.refill_days} Hari
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Target */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
            Target *
          </label>
          <div className="relative">
            <ExternalLink size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
            <input
              type="url"
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="Masukkan link target (contoh: https://instagram.com/...)"
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Quantity + Price row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Quantity */}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
              Quantity *
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantity}
              onChange={e => {
                const v = e.target.value.replace(/[^0-9]/g, '');
                setQuantity(v);
              }}
              placeholder={selectedService ? `Min: ${selectedService.min_qty.toLocaleString()}` : '0'}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {selectedService && (
              <div className="flex gap-2 mt-1.5">
                <button
                  onClick={() => setQuantity(String(selectedService.min_qty))}
                  className="px-2.5 py-1 text-[10px] font-bold bg-surface-container-low border border-outline-variant/30 rounded-lg hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                >
                  Min: {selectedService.min_qty.toLocaleString()}
                </button>
                <button
                  onClick={() => setQuantity(String(selectedService.max_qty))}
                  className="px-2.5 py-1 text-[10px] font-bold bg-surface-container-low border border-outline-variant/30 rounded-lg hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                >
                  Max: {selectedService.max_qty.toLocaleString()}
                </button>
              </div>
            )}
          </div>

          {/* Total Price */}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
              Total Harga
            </label>
            <div className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 px-4 text-sm">
              <span className={`font-bold text-lg ${totalPrice > 0 ? 'text-primary' : 'text-on-surface-variant'}`}>
                {formatRupiah(totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleReset}
            className="px-5 py-3 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:text-error hover:border-error/30 hover:bg-error/5 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedService || !target || !quantity || ordering || totalPrice <= 0}
            className="flex-1 py-3 rounded-xl gradient-primary text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-primary/20"
          >
            {ordering ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ShoppingCart size={16} />
            )}
            {ordering ? 'Memproses...' : 'Beli Sekarang'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {products.length > 0 && (
        <div className="text-center text-xs text-on-surface-variant/60">
          {products.length.toLocaleString()} layanan tersedia • {platformsData.length - 1} platform
        </div>
      )}
    </div>
  );
}
