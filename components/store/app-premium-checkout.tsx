'use client';

import { useState } from 'react';
import { useCheckout } from '@/hooks/use-checkout';
import ConfirmationStep from '@/components/checkout/confirmation-step';
import PaymentStep from '@/components/checkout/payment-step';
import { formatRupiah } from '@/lib/utils';
import { ChevronRight, Crown, Package } from 'lucide-react';
import Link from 'next/link';

interface PlanItem {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface AppItem {
  id: string;
  name: string;
  image_url: string | null;
  description: string | null;
  brand?: string;
  price_sell: number;
  plans: PlanItem[];
}

interface AppPremiumCheckoutProps {
  apps: AppItem[];
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="flex items-center gap-2 font-bold mb-3 font-[family-name:var(--font-heading)] text-on-surface">
      <span className="w-7 h-7 rounded-full gradient-primary text-white text-sm flex items-center justify-center font-bold">{n}</span>
      {title}
    </h2>
  );
}

export default function AppPremiumCheckout({ apps }: AppPremiumCheckoutProps) {
  const { state, actions, go } = useCheckout({ name: 'App Premium', needs_target: false });
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerWA, setBuyerWA] = useState('');

  // Step flow: app -> plan -> confirm -> payment
  const [step, setStep] = useState<'app' | 'plan' | 'confirm' | 'payment'>('app');

  const price = selectedPlan?.price || 0;

  // Group apps by brand (category)
  const brands = [...new Set(apps.map(a => a.brand || 'Lainnya'))];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">App Premium</span>
      </nav>

      <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
        <Crown size={28} /> App Premium
      </h1>

      {/* Step 1: Pilih Aplikasi */}
      {step === 'app' && (
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-soft">
          <StepTitle n={1} title="Pilih Aplikasi" />

          {apps.length === 0 ? (
            <div className="text-center py-12">
              <Package size={40} className="mx-auto mb-3 text-on-surface-variant/40" />
              <p className="text-sm text-on-surface-variant">
                Belum ada aplikasi premium tersedia. Owner perlu menambahkan di panel.
              </p>
            </div>
          ) : (
            <>
              {brands.map(brand => {
                const brandApps = apps.filter(a => (a.brand || 'Lainnya') === brand);
                return (
                  <div key={brand} className="mb-6 last:mb-0">
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 px-1">{brand}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {brandApps.map(app => {
                        const minPrice = app.plans.length > 0
                          ? Math.min(...app.plans.map(p => p.price))
                          : app.price_sell;

                        return (
                          <button
                            key={app.id}
                            onClick={() => {
                              setSelectedApp(app);
                              setSelectedPlan(null);
                              setStep('plan');
                            }}
                            className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                              selectedApp?.id === app.id
                                ? 'border-primary bg-primary/5'
                                : 'border-outline-variant/30 hover:border-pink-300'
                            }`}
                          >
                            {app.image_url && (
                              <img src={app.image_url} alt={app.name} className="w-12 h-12 rounded-xl object-cover mb-2" />
                            )}
                            <p className="font-semibold text-sm text-on-surface">{app.name}</p>
                            {app.plans.length > 0 ? (
                              <p className="text-primary font-bold text-sm mt-1 font-[family-name:var(--font-heading)]">
                                {app.plans.length} plan · mulai {formatRupiah(minPrice)}
                              </p>
                            ) : (
                              <p className="text-on-surface-variant text-xs mt-1">Belum ada plan</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </section>
      )}

      {/* Step 2: Pilih Plan */}
      {step === 'plan' && selectedApp && (
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-soft max-w-lg">
          <StepTitle n={2} title="Pilih Plan" />

          <div className="mb-4 p-3 rounded-xl bg-surface-container-high text-sm flex items-center gap-2">
            {selectedApp.image_url && (
              <img src={selectedApp.image_url} alt={selectedApp.name} className="w-8 h-8 rounded-lg object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-on-surface-variant">Aplikasi: </span>
              <span className="font-semibold text-on-surface">{selectedApp.name}</span>
            </div>
            <button onClick={() => setStep('app')} className="text-primary text-xs font-semibold hover:underline shrink-0">Ubah</button>
          </div>

          {selectedApp.plans.length === 0 ? (
            <p className="text-center text-sm text-on-surface-variant py-8">
              Belum ada plan untuk aplikasi ini. Owner perlu menambahkan plan di panel.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {selectedApp.plans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  disabled={plan.stock === 0}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    selectedPlan?.id === plan.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : plan.stock === 0
                        ? 'border-outline-variant/20 bg-surface-container-high/50 opacity-50 cursor-not-allowed'
                        : 'border-outline-variant/30 hover:border-pink-300'
                  }`}
                >
                  <p className="text-sm font-semibold">{plan.name}</p>
                  <p className="text-sm font-bold text-primary mt-0.5">{formatRupiah(plan.price)}</p>
                  {plan.stock === 0 ? (
                    <p className="text-[10px] text-error mt-0.5">Habis</p>
                  ) : plan.stock > 0 && plan.stock <= 5 ? (
                    <p className="text-[10px] text-amber-500 mt-0.5">Sisa {plan.stock}</p>
                  ) : null}
                </button>
              ))}
            </div>
          )}

          {selectedPlan && (
            <div className="space-y-3 mt-4 pt-4 border-t border-outline-variant/30">
              <input value={buyerName} onChange={e => setBuyerName(e.target.value)}
                placeholder="Nama Anda"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />

              <input value={buyerWA} onChange={e => setBuyerWA(e.target.value)}
                placeholder="No. WhatsApp (untuk pengiriman akun)"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />

              <div className="p-3 rounded-xl bg-surface-container-high flex justify-between text-sm">
                <span className="text-on-surface-variant">Total</span>
                <span className="font-bold text-primary">{formatRupiah(price)}</span>
              </div>

              <button
                disabled={!buyerName.trim() || !buyerWA.trim()}
                onClick={() => {
                  actions.setField('buyerName', buyerName);
                  actions.setField('buyerPhone', buyerWA);
                  go({
                    nominal: {
                      id: selectedApp.id,
                      name: `${selectedApp.name} — ${selectedPlan.name}`,
                      price,
                      price_sell: price,
                    },
                    targetInput: `${buyerName} (${buyerWA})`,
                    product: { name: selectedApp.name },
                  });
                  setStep('confirm');
                }}
                className="w-full py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-40"
              >
                Lanjut Konfirmasi
              </button>
            </div>
          )}
        </section>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && (
        <ConfirmationStep
          state={{
            ...state,
            product: { name: selectedApp?.name || 'App Premium' },
            nominal: {
              id: selectedApp?.id,
              name: `${selectedApp?.name} — ${selectedPlan?.name}`,
              price,
              price_sell: price,
            },
            targetInput: `${buyerName} (${buyerWA})`,
          }}
          onConfirm={async () => {
            setStep('payment');
            try {
              const res = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  product_id: selectedApp?.id,
                  product_name: `${selectedApp?.name} — ${selectedPlan?.name}`,
                  target_input: buyerWA,
                  amount: price,
                  buyer_name: buyerName,
                  buyer_phone: buyerWA,
                }),
              });
              const data = await res.json();
              if (!res.ok) {
                alert('Gagal membuat pesanan: ' + (data?.error || 'Unknown'));
                setStep('confirm');
                return;
              }
              go({ orderId: data.orderId, qrisUrl: data.qrisUrl });
            } catch {
              alert('Gagal: Kesalahan jaringan');
              setStep('confirm');
            }
          }}
          onBack={() => setStep('plan')}
        />
      )}

      {/* Step 4: Payment */}
      {step === 'payment' && (
        <PaymentStep
          orderId={state.orderId}
          qrisUrl={state.qrisUrl}
          amount={price}
          productName={`${selectedApp?.name} — ${selectedPlan?.name}`}
        />
      )}
    </div>
  );
}
