'use client';

import { useState } from 'react';
import { useCheckout } from '@/hooks/use-checkout';
import ConfirmationStep from '@/components/checkout/confirmation-step';
import PaymentStep from '@/components/checkout/payment-step';
import { formatRupiah } from '@/lib/utils';
import { ChevronRight, Crown, Clock } from 'lucide-react';
import Link from 'next/link';

interface AppItem {
  id: string;
  name: string;
  image_url: string | null;
  description: string | null;
  price_sell: number;
}

interface AppPremiumCheckoutProps {
  apps: AppItem[];
}

const DURATIONS = [
  { value: 7, unit: 'hari' as const, label: '7 Hari', mult: 0.3 },
  { value: 14, unit: 'hari' as const, label: '14 Hari', mult: 0.55 },
  { value: 1, unit: 'bulan' as const, label: '1 Bulan', mult: 1 },
  { value: 3, unit: 'bulan' as const, label: '3 Bulan', mult: 2.85 },
  { value: 6, unit: 'bulan' as const, label: '6 Bulan', mult: 5.5 },
  { value: 12, unit: 'bulan' as const, label: '12 Bulan', mult: 10 },
];

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
  const [duration, setDuration] = useState<typeof DURATIONS[0] | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerWA, setBuyerWA] = useState('');

  // Custom step flow: app → duration → confirm → payment
  const [step, setStep] = useState<'app' | 'duration' | 'confirm' | 'payment'>('app');

  const price = selectedApp ? Math.round(selectedApp.price_sell * (duration?.mult ?? 1)) : 0;

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {apps.map(app => (
              <button
                key={app.id}
                onClick={() => { setSelectedApp(app); setStep('duration'); }}
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
                <p className="text-primary font-bold text-sm mt-1 font-[family-name:var(--font-heading)]">
                  {formatRupiah(app.price_sell)}/bln
                </p>
              </button>
            ))}
          </div>
          {apps.length === 0 && (
            <p className="text-center text-sm text-on-surface-variant py-8">
              Belum ada aplikasi premium tersedia.
            </p>
          )}
        </section>
      )}

      {/* Step 2: Pilih Durasi */}
      {step === 'duration' && selectedApp && (
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-soft max-w-lg">
          <StepTitle n={2} title="Pilih Durasi Langganan" />

          <div className="mb-4 p-3 rounded-xl bg-surface-container-high text-sm">
            <span className="text-on-surface-variant">Aplikasi: </span>
            <span className="font-semibold text-on-surface">{selectedApp.name}</span>
            <button onClick={() => setStep('app')} className="ml-3 text-primary text-xs font-semibold hover:underline">Ubah</button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {DURATIONS.map(d => (
              <button
                key={d.label}
                onClick={() => setDuration(d)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  duration?.label === d.label
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-outline-variant/30 hover:border-pink-300'
                }`}
              >
                <Clock size={16} className="mx-auto mb-1 opacity-60" />
                <p className="text-sm font-semibold">{d.label}</p>
                <p className="text-xs text-primary font-bold mt-0.5">
                  {formatRupiah(Math.round(selectedApp.price_sell * d.mult))}
                </p>
              </button>
            ))}
          </div>

          <input value={buyerName} onChange={e => setBuyerName(e.target.value)}
            placeholder="Nama Anda"
            className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />

          <input value={buyerWA} onChange={e => setBuyerWA(e.target.value)}
            placeholder="No. WhatsApp (untuk pengiriman akun)"
            className="w-full mt-3 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />

          <button
            disabled={!duration || !buyerName.trim() || !buyerWA.trim()}
            onClick={() => {
              actions.setField('buyerName', buyerName);
              actions.setField('buyerPhone', buyerWA);
              go({
                nominal: { id: selectedApp.id, name: `${selectedApp.name} — ${duration!.label}`, price: price, price_sell: price },
                targetInput: `${buyerName} (${buyerWA})`,
                duration: { value: duration!.value, unit: duration!.unit, label: duration!.label },
                product: { name: selectedApp.name },
              });
              setStep('confirm');
            }}
            className="w-full mt-4 py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-40"
          >
            Lanjut Konfirmasi
          </button>
        </section>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && (
        <ConfirmationStep
          state={{
            ...state,
            product: { name: selectedApp?.name || 'App Premium' },
            nominal: { id: selectedApp?.id, name: `${selectedApp?.name} — ${duration?.label}`, price: price, price_sell: price },
            targetInput: `${buyerName} (${buyerWA})`,
            duration: duration ? { value: duration.value, unit: duration.unit, label: duration.label } : null,
          }}
          onConfirm={async () => {
            setStep('payment');
            try {
              const res = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  product_id: selectedApp?.id,
                  product_name: `${selectedApp?.name} — ${duration?.label}`,
                  target_input: buyerWA,
                  amount: price,
                  duration,
                  buyer_name: buyerName,
                  buyer_phone: buyerWA,
                }),
              });
              const data = await res.json();
              go({ orderId: data.orderId, qrisUrl: data.qrisUrl });
            } catch {
              setStep('confirm');
            }
          }}
          onBack={() => setStep('duration')}
        />
      )}

      {/* Step 4: Payment */}
      {step === 'payment' && (
        <PaymentStep
          orderId={state.orderId}
          qrisUrl={state.qrisUrl}
          amount={price}
          productName={`${selectedApp?.name} — ${duration?.label}`}
        />
      )}
    </div>
  );
}
