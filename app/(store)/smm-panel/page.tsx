'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatRupiah } from '@/lib/utils';
import { useCheckout } from '@/hooks/use-checkout';
import PaymentStep from '@/components/checkout/payment-step';
import {
  ChevronRight, Share2, ShoppingCart, Info, Gauge, BadgeCheck,
  ArrowDown, ArrowUp, Loader2, Camera, CirclePlay, Music2, Hash,
  Globe, MessageCircle, Send, Smartphone,
} from 'lucide-react';
import Link from 'next/link';

/* ── Ikon platform ── */
const PLATFORM_ICONS: Record<string, any> = {
  instagram: Camera,
  youtube: CirclePlay,
  tiktok: Music2,
  twitter: Hash,
  x: Hash,
  facebook: Globe,
  telegram: Send,
  whatsapp: MessageCircle,
  spotify: Music2,
  threads: Smartphone,
};

function getPlatformIcon(name: string) {
  const key = name.toLowerCase();
  return PLATFORM_ICONS[key] || Globe;
}

/* ── Komponen kartu langkah ── */
function StepCard({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-soft">
      <h3 className="font-bold mb-4 flex items-center gap-3 text-on-surface font-[family-name:var(--font-heading)]">
        <span className="w-8 h-8 rounded-full gradient-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
          {n}
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ── Baris ringkasan ── */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1.5">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-on-surface">{value}</span>
    </div>
  );
}

/* ── Interface produk ── */
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
}

/* ===== HALAMAN UTAMA ===== */
export default function SMMPanelPage() {
  const supabase = createClient();
  const { state, go } = useCheckout({ name: 'SMM Panel', needs_target: false });

  const [products, setProducts] = useState<SMMProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [platform, setPlatform] = useState<string | null>(null);
  const [service, setService] = useState<SMMProduct | null>(null);
  const [target, setTarget] = useState('');
  const [qty, setQty] = useState(1000);

  // Checkout state
  const [checkoutPhase, setCheckoutPhase] = useState<'form' | 'payment'>('form');
  const [ordering, setOrdering] = useState(false);

  // Load produk SMM dari Supabase
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, price_sell, provider_code, description, min_qty, max_qty, smm_category')
        .eq('module', 'jokerpanel')
        .eq('is_active', true)
        .order('brand', { ascending: true });

      if (error) {
        console.error('[SMM] load error:', error.message);
      }

      setProducts(
        (data ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          brand: p.brand ?? 'Lainnya',
          price_sell: Number(p.price_sell),
          provider_code: p.provider_code ?? '',
          description: p.description ?? '',
          min_qty: Number(p.min_qty) || 10,
          max_qty: Number(p.max_qty) || 100000,
          smm_category: p.smm_category ?? '',
        }))
      );
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Daftar platform unik
  const platforms = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))),
    [products]
  );

  // Layanan yang sesuai platform terpilih
  const filteredServices = useMemo(
    () => products.filter((p) => p.brand === platform),
    [products, platform]
  );

  // Min/max dari service terpilih
  const min = service?.min_qty || 10;
  const max = service?.max_qty || 100000;
  const clampedQty = Math.min(max, Math.max(qty || min, min));

  // Harga total: (qty / 1000) × harga per 1K
  const total = service ? Math.round((clampedQty / 1000) * service.price_sell) : 0;

  // Handler beli
  async function handleBuy() {
    if (!service || !target.trim()) return;
    setOrdering(true);
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: service.id,
          product_name: service.name,
          target_input: target,
          amount: total,
          quantity: clampedQty,
          nominal_code: service.provider_code,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert('Gagal membuat pesanan: ' + (data?.error || 'Unknown'));
        setOrdering(false);
        return;
      }
      go({
        orderId: data.orderId,
        qrString: data.qrString,
        testMode: data.testMode,
      });
      setCheckoutPhase('payment');
    } catch (err: any) {
      alert('Gagal: Kesalahan jaringan');
      console.error('[SMM] order error:', err);
    }
    setOrdering(false);
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // Fase pembayaran
  if (checkoutPhase === 'payment') {
    return (
      <div className="space-y-6 animate-fade-in">
        <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
          <ChevronRight size={14} />
          <Link href="/smm-panel" className="hover:text-primary transition-colors" onClick={(e) => { e.preventDefault(); setCheckoutPhase('form'); }}>Sosial Media</Link>
          <ChevronRight size={14} />
          <span className="text-primary font-semibold">Pembayaran</span>
        </nav>

        <PaymentStep
          orderId={state.orderId}
          qrisUrl={null}
          qrString={state.qrString}
          testMode={state.testMode}
          amount={total}
          productName={service?.name || 'SMM'}
        />
      </div>
    );
  }

  // Fase form utama
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">Sosial Media</span>
      </nav>

      <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
        <Share2 size={28} /> Sosial Media (SMM Panel)
      </h1>
      <p className="text-sm text-on-surface-variant -mt-4">Buat pesanan baru untuk layanan sosial media.</p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ══════════ FORM UTAMA (2 kolom) ══════════ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Langkah 1: Pilih Kategori/Platform ── */}
          <StepCard n={1} title="Pilih Kategori">
            {platforms.length === 0 ? (
              <p className="text-center text-sm text-on-surface-variant py-6">
                Belum ada layanan SMM. Owner perlu sync dari JokerPanel di panel.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {platforms.map((p) => {
                  const Icon = getPlatformIcon(p);
                  const isActive = platform === p;
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        setPlatform(p);
                        setService(null);
                        setQty(1000);
                      }}
                      className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all capitalize
                        ${isActive
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-outline-variant/30 hover:border-primary/40 text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                      <Icon size={28} className="mb-2" />
                      <span className="text-sm font-semibold">{p}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </StepCard>

          {/* ── Langkah 2: Pilih Layanan ── */}
          <StepCard n={2} title="Pilih Layanan">
            <select
              value={service?.id || ''}
              disabled={!platform}
              onChange={(e) => {
                const found = filteredServices.find((s) => s.id === e.target.value);
                setService(found || null);
                if (found) setQty(found.min_qty);
              }}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
            >
              <option value="">
                {platform ? 'Pilih layanan…' : 'Pilih kategori terlebih dahulu'}
              </option>
              {filteredServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {formatRupiah(s.price_sell)}/1K
                </option>
              ))}
            </select>
          </StepCard>

          {/* ── Langkah 3: Input Data ── */}
          <StepCard n={3} title="Input Data">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-on-surface">Link Target / Username</label>
                <input
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="Contoh: https://instagram.com/username atau username"
                  className="w-full mt-1.5 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-on-surface">Jumlah (Quantity)</label>
                <input
                  type="number"
                  value={clampedQty}
                  min={min}
                  max={max}
                  step={100}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full mt-1.5 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                {service && (
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Min {min.toLocaleString('id-ID')} · Max {max.toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>
          </StepCard>
        </div>

        {/* ══════════ SIDEBAR ══════════ */}
        <div className="space-y-6">

          {/* ── Ringkasan Pesanan ── */}
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 shadow-soft sticky top-24">
            <h3 className="font-bold text-on-surface mb-4 font-[family-name:var(--font-heading)] flex items-center gap-2">
              <ShoppingCart size={18} className="text-primary" />
              Ringkasan Pesanan
            </h3>

            <SummaryRow
              label="Harga per 1.000"
              value={service ? formatRupiah(service.price_sell) : '—'}
            />
            <SummaryRow
              label="Jumlah Pesanan"
              value={clampedQty.toLocaleString('id-ID')}
            />

            <div className="border-t border-outline-variant/30 my-3" />

            <div className="flex justify-between items-center">
              <span className="font-semibold text-on-surface">Total Harga</span>
              <span className="text-xl font-extrabold text-primary font-[family-name:var(--font-heading)]">
                {formatRupiah(total)}
              </span>
            </div>

            <button
              disabled={!service || !target.trim() || ordering}
              onClick={handleBuy}
              className="w-full mt-5 py-3 rounded-xl gradient-primary text-white font-bold flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {ordering ? (
                <><Loader2 size={18} className="animate-spin" /> Memproses…</>
              ) : (
                <><ShoppingCart size={18} /> Beli Sekarang</>
              )}
            </button>
          </div>

          {/* ── Informasi Layanan ── */}
          {service && (
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 text-sm text-on-surface-variant space-y-3 shadow-soft animate-fade-in">
              <h3 className="flex items-center gap-2 font-bold text-on-surface font-[family-name:var(--font-heading)]">
                <Info size={16} className="text-primary" /> Informasi Layanan
              </h3>

              <div className="space-y-2">
                <p className="flex items-start gap-2">
                  <Gauge size={16} className="shrink-0 mt-0.5 text-primary/60" />
                  <span><strong>Kecepatan:</strong> Lihat deskripsi layanan</span>
                </p>
                <p className="flex items-start gap-2">
                  <BadgeCheck size={16} className="shrink-0 mt-0.5 text-primary/60" />
                  <span><strong>Kualitas:</strong> {service.description || '—'}</span>
                </p>
                <p className="flex items-start gap-2">
                  <ArrowDown size={16} className="shrink-0 mt-0.5 text-primary/60" />
                  <span><strong>Minimal Pesan:</strong> {min.toLocaleString('id-ID')}</span>
                </p>
                <p className="flex items-start gap-2">
                  <ArrowUp size={16} className="shrink-0 mt-0.5 text-primary/60" />
                  <span><strong>Maksimal Pesan:</strong> {max.toLocaleString('id-ID')}</span>
                </p>
              </div>

              <div className="mt-3 p-3 rounded-xl bg-error/5 border border-error/20 text-error text-xs font-medium">
                ⚠️ Pastikan akun tidak di-private saat proses berlangsung!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
