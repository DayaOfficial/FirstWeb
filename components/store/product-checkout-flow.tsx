'use client';

import { useCheckout, type NominalOption } from '@/hooks/use-checkout';
import ConfirmationStep from '@/components/checkout/confirmation-step';
import PaymentStep from '@/components/checkout/payment-step';
import { formatRupiah } from '@/lib/utils';
import { ChevronRight, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

/* Brand color & icon mapping */
const BRAND_META: Record<string, { color: string; icon: string }> = {
  'TELKOMSEL':  { color: '#ED1C24', icon: 'T' },
  'INDOSAT':    { color: '#FFDD00', icon: 'I' },
  'XL':         { color: '#0068B7', icon: 'XL' },
  'AXIS':       { color: '#6D2E8A', icon: 'AX' },
  'TRI':        { color: '#FF6600', icon: '3' },
  'SMARTFREN':  { color: '#F7941E', icon: 'SF' },
  'BY.U':       { color: '#00AEEF', icon: 'BY' },
  'DANA':       { color: '#118EEA', icon: 'DA' },
  'OVO':        { color: '#4C3494', icon: 'OV' },
  'GOPAY':      { color: '#00AAD2', icon: 'GP' },
  'SHOPEEPAY':  { color: '#EE4D2D', icon: 'SP' },
  'LINKAJA':    { color: '#E42313', icon: 'LA' },
  'PLN':        { color: '#1A73E8', icon: '⚡' },
  'GRAB':       { color: '#00B14F', icon: 'GR' },
  'MAXIM':      { color: '#FF4444', icon: 'MX' },
  'GARENA':     { color: '#EE4D2D', icon: 'GR' },
  'STEAM':      { color: '#1B2838', icon: 'ST' },
  'GOOGLE PLAY':{ color: '#34A853', icon: 'GP' },
  'VOUCHER':    { color: '#6366F1', icon: 'V' },
};

function getBrandMeta(brand: string) {
  const key = brand.toUpperCase();
  return BRAND_META[key] || { color: '#6366F1', icon: brand.slice(0, 2).toUpperCase() };
}

interface ProductItem {
  id: string;
  name: string;
  brand: string;
  price_sell: number;
  buyer_sku_code?: string;
  provider_service_id?: string;
}

interface ProductCheckoutFlowProps {
  title: string;
  inputLabel: string;
  inputPlaceholder: string;
  inputType?: string;
  products: ProductItem[];
  category: string;
  showBrandFilter?: boolean;
  inputHelper?: string;
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="flex items-center gap-2 font-bold mb-3 font-[family-name:var(--font-heading)] text-on-surface">
      <span className="w-7 h-7 rounded-full gradient-primary text-white text-sm flex items-center justify-center font-bold">{n}</span>
      {title}
    </h2>
  );
}

/* Brand card component */
function BrandCard({ brand, count, selected, onClick }: { brand: string; count: number; selected: boolean; onClick: () => void }) {
  const meta = getBrandMeta(brand);
  return (
    <button onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl p-4 border-2 transition-all duration-200 hover:shadow-md flex flex-col items-center gap-2 ${
        selected
          ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(192,0,58,0.15)]'
          : 'border-outline-variant/30 bg-surface-container-lowest hover:border-pink-300'
      }`}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md"
        style={{ backgroundColor: meta.color }}>
        {meta.icon}
      </div>
      <div className="text-center">
        <p className="font-semibold text-sm text-on-surface leading-tight">{brand}</p>
        <p className="text-[10px] text-on-surface-variant">{count} produk</p>
      </div>
    </button>
  );
}

export default function ProductCheckoutFlow({
  title, inputLabel, inputPlaceholder, inputType = 'tel',
  products, category, showBrandFilter = true, inputHelper,
}: ProductCheckoutFlowProps) {
  const { state, actions } = useCheckout({ name: category, needs_target: true });
  const [targetValue, setTargetValue] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique brands with counts
  const brandCounts = new Map<string, number>();
  for (const p of products) {
    if (p.brand) brandCounts.set(p.brand, (brandCounts.get(p.brand) || 0) + 1);
  }
  const brands = Array.from(brandCounts.keys());

  // Filter products
  const filtered = products
    .filter(p => !brandFilter || p.brand === brandFilter)
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">{title}</span>
      </nav>

      <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)]">
        {title}
      </h1>

      {/* Step 1: Input */}
      {state.step === 'input' && (
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-soft max-w-lg">
          <StepTitle n={1} title={inputLabel} />
          <input
            type={inputType}
            value={targetValue}
            onChange={e => setTargetValue(e.target.value)}
            placeholder={inputPlaceholder}
            className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          {inputHelper && <p className="text-xs text-on-surface-variant mt-2">{inputHelper}</p>}
          {state.error && <p className="text-sm text-error mt-2">{state.error}</p>}
          <button
            disabled={targetValue.trim().length < 4}
            onClick={() => actions.submitInput(targetValue)}
            className="mt-4 px-6 py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Lanjut Pilih Produk
          </button>
        </section>
      )}

      {/* Step 2: Nominal — with brand grid */}
      {state.step === 'nominal' && (
        <section className="space-y-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-soft">
            <StepTitle n={2} title="Pilih Produk" />

            {/* Info target */}
            <div className="mb-4 p-3 rounded-xl bg-surface-container-high text-sm">
              <span className="text-on-surface-variant">{inputLabel}: </span>
              <span className="font-semibold text-on-surface">{state.targetInput}</span>
              <button onClick={actions.back} className="ml-3 text-primary text-xs font-semibold hover:underline">Ubah</button>
            </div>

            {/* Brand Grid */}
            {showBrandFilter && brands.length > 1 && !brandFilter && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-on-surface mb-3">Pilih Operator / Brand</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {brands.map(b => (
                    <BrandCard
                      key={b}
                      brand={b}
                      count={brandCounts.get(b) || 0}
                      selected={brandFilter === b}
                      onClick={() => setBrandFilter(b)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Selected brand header + back */}
            {brandFilter && (
              <div className="mb-4 flex items-center gap-3">
                <button onClick={() => setBrandFilter('')}
                  className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors">
                  <ArrowLeft size={16} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ backgroundColor: getBrandMeta(brandFilter).color }}>
                    {getBrandMeta(brandFilter).icon}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{brandFilter}</p>
                    <p className="text-xs text-on-surface-variant">{filtered.length} produk tersedia</p>
                  </div>
                </div>
              </div>
            )}

            {/* Products list (show when brand selected or only 1 brand) */}
            {(brandFilter || brands.length <= 1) && (
              <>
                {/* Search */}
                {filtered.length > 8 && (
                  <div className="relative max-w-xs mb-4">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Cari..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-outline-variant text-xs bg-surface-container-lowest outline-none focus:border-primary"
                    />
                  </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filtered.map(n => (
                    <button
                      key={n.id}
                      onClick={() => actions.selectNominal({
                        id: n.id,
                        name: n.name,
                        price: n.price_sell,
                        price_sell: n.price_sell,
                        buyer_sku_code: n.buyer_sku_code,
                        provider_code: n.provider_service_id,
                      } as NominalOption)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                        state.nominal?.id === n.id
                          ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(192,0,58,0.15)]'
                          : 'border-outline-variant/30 hover:border-pink-300'
                      }`}
                    >
                      <p className="font-semibold text-sm text-on-surface leading-tight">{n.name}</p>
                      <p className="text-primary font-bold mt-1 font-[family-name:var(--font-heading)]">
                        {formatRupiah(n.price_sell)}
                      </p>
                    </button>
                  ))}
                </div>

                {filtered.length === 0 && (
                  <p className="text-center text-sm text-on-surface-variant py-8">
                    Belum ada produk tersedia.
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* Step 3: Confirm */}
      {state.step === 'confirm' && (
        <ConfirmationStep
          state={{
            ...state,
            product: { name: state.nominal?.name || category },
          }}
          onConfirm={actions.confirmAndPay}
          onBack={actions.back}
        />
      )}

      {/* Step 4: Payment */}
      {state.step === 'payment' && (
        <PaymentStep
          orderId={state.orderId}
          qrisUrl={state.qrisUrl}
          qrString={state.qrString}
          testMode={state.testMode}
          amount={state.nominal?.price_sell || state.nominal?.price || 0}
          productName={state.nominal?.name || category}
        />
      )}
    </div>
  );
}
