'use client';

import { useCheckout, type NominalOption } from '@/hooks/use-checkout';
import ConfirmationStep from '@/components/checkout/confirmation-step';
import PaymentStep from '@/components/checkout/payment-step';
import { formatRupiah } from '@/lib/utils';
import { ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

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
  /** Apakah tampilkan filter brand */
  showBrandFilter?: boolean;
  /** Helper text di bawah input */
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

export default function ProductCheckoutFlow({
  title, inputLabel, inputPlaceholder, inputType = 'tel',
  products, category, showBrandFilter = true, inputHelper,
}: ProductCheckoutFlowProps) {
  const { state, actions } = useCheckout({ name: category, needs_target: true });
  const [targetValue, setTargetValue] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique brands
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

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
            Lanjut Pilih Nominal
          </button>
        </section>
      )}

      {/* Step 2: Nominal */}
      {state.step === 'nominal' && (
        <section className="space-y-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-soft">
            <StepTitle n={2} title="Pilih Nominal" />

            {/* Info target */}
            <div className="mb-4 p-3 rounded-xl bg-surface-container-high text-sm">
              <span className="text-on-surface-variant">{inputLabel}: </span>
              <span className="font-semibold text-on-surface">{state.targetInput}</span>
              <button onClick={actions.back} className="ml-3 text-primary text-xs font-semibold hover:underline">Ubah</button>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {showBrandFilter && brands.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setBrandFilter('')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      !brandFilter ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Semua
                  </button>
                  {brands.map(b => (
                    <button
                      key={b}
                      onClick={() => setBrandFilter(b)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        brandFilter === b ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
              {products.length > 8 && (
                <div className="relative flex-1 max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-outline-variant text-xs bg-surface-container-lowest outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>

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
                  {n.brand && <p className="text-[10px] text-on-surface-variant mt-0.5">{n.brand}</p>}
                  <p className="text-primary font-bold mt-1 font-[family-name:var(--font-heading)]">
                    {formatRupiah(n.price_sell)}
                  </p>
                </button>
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-sm text-on-surface-variant py-8">
                Belum ada produk tersedia. Owner perlu sync & aktifkan produk di panel.
              </p>
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
          amount={state.nominal?.price_sell || state.nominal?.price || 0}
          productName={state.nominal?.name || category}
        />
      )}
    </div>
  );
}
