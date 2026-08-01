'use client';

import { useState } from 'react';
import { useCheckout } from '@/hooks/use-checkout';
import ConfirmationStep from '@/components/checkout/confirmation-step';
import PaymentStep from '@/components/checkout/payment-step';
import { formatRupiah } from '@/lib/utils';
import { ChevronRight, Share2, Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface SMMService {
  id: string;
  name: string;
  platform: string;
  price_per_k: number;
  provider_service_id: string;
  description: string;
}

interface SMMCheckoutProps {
  services: SMMService[];
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="flex items-center gap-2 font-bold mb-3 font-[family-name:var(--font-heading)] text-on-surface">
      <span className="w-7 h-7 rounded-full gradient-primary text-white text-sm flex items-center justify-center font-bold">{n}</span>
      {title}
    </h2>
  );
}

export default function SMMCheckout({ services }: SMMCheckoutProps) {
  const { state, actions, go } = useCheckout({ name: 'SMM Panel', needs_target: false });
  const [step, setStep] = useState<'service' | 'input' | 'confirm' | 'payment'>('service');
  const [selectedService, setSelectedService] = useState<SMMService | null>(null);
  const [platformFilter, setPlatformFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [targetLink, setTargetLink] = useState('');
  const [quantity, setQuantity] = useState(1000);

  const platforms = [...new Set(services.map(s => s.platform))];
  const filtered = services
    .filter(s => !platformFilter || s.platform === platformFilter)
    .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalPrice = selectedService ? Math.round((selectedService.price_per_k / 1000) * quantity) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">Sosial Media</span>
      </nav>

      <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
        <Share2 size={28} /> Sosial Media Marketing
      </h1>

      {/* Step 1: Pilih Layanan */}
      {step === 'service' && (
        <section className="space-y-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-soft">
            <StepTitle n={1} title="Pilih Layanan" />

            {/* Platform tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setPlatformFilter('')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  !platformFilter ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
                }`}
              >
                Semua
              </button>
              {platforms.map(p => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    platformFilter === p ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative max-w-sm mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari layanan..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-outline-variant text-xs bg-surface-container-lowest outline-none focus:border-primary" />
            </div>

            {/* Service list */}
            <div className="divide-y divide-outline-variant/30 max-h-[500px] overflow-y-auto rounded-xl border border-outline-variant/30">
              {filtered.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s); setStep('input'); }}
                  className={`w-full text-left p-4 hover:bg-surface-container-low transition-colors ${
                    selectedService?.id === s.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-on-surface leading-tight">{s.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded-full text-on-surface-variant font-medium">{s.platform}</span>
                        {s.description && <span className="text-[10px] text-on-surface-variant truncate">{s.description}</span>}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-primary font-[family-name:var(--font-heading)] shrink-0">
                      {formatRupiah(s.price_per_k)}/1K
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-sm text-on-surface-variant py-8">
                Belum ada layanan SMM. Owner perlu sync dari JokerPanel di panel.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Step 2: Input Link + Quantity */}
      {step === 'input' && selectedService && (
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-soft max-w-lg">
          <StepTitle n={2} title="Isi Detail Pesanan" />

          <div className="mb-4 p-3 rounded-xl bg-surface-container-high text-sm">
            <span className="text-on-surface-variant">Layanan: </span>
            <span className="font-semibold text-on-surface">{selectedService.name}</span>
            <button onClick={() => setStep('service')} className="ml-3 text-primary text-xs font-semibold hover:underline">Ubah</button>
          </div>

          <label className="text-sm font-semibold text-on-surface">Link / Username</label>
          <div className="relative mt-1 mb-3">
            <ExternalLink size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input type="url" value={targetLink} onChange={e => setTargetLink(e.target.value)}
              placeholder="https://instagram.com/username atau link post"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          </div>

          <label className="text-sm font-semibold text-on-surface">Jumlah</label>
          <input type="number" value={quantity} onChange={e => setQuantity(Math.max(100, Number(e.target.value)))}
            min={100} step={100}
            className="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          <p className="text-xs text-on-surface-variant mt-1">
            Harga: {formatRupiah(selectedService.price_per_k)}/1000 — Total: <strong className="text-primary">{formatRupiah(totalPrice)}</strong>
          </p>

          <button
            disabled={!targetLink.trim() || quantity < 100}
            onClick={() => {
              go({
                nominal: {
                  id: selectedService.id,
                  name: `${selectedService.name} (${quantity.toLocaleString('id-ID')})`,
                  price: totalPrice,
                  price_sell: totalPrice,
                  provider_code: selectedService.provider_service_id,
                },
                targetInput: targetLink,
                product: { name: selectedService.name },
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
            product: { name: selectedService?.name || 'SMM' },
            targetInput: targetLink,
          }}
          onConfirm={async () => {
            setStep('payment');
            try {
              const res = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  product_id: selectedService?.id,
                  product_name: state.nominal?.name,
                  target_input: targetLink,
                  amount: totalPrice,
                  nominal_code: selectedService?.provider_service_id,
                }),
              });
              const data = await res.json();
              go({ orderId: data.orderId, qrisUrl: data.qrisUrl });
            } catch {
              setStep('confirm');
            }
          }}
          onBack={() => setStep('input')}
        />
      )}

      {/* Step 4: Payment */}
      {step === 'payment' && (
        <PaymentStep
          orderId={state.orderId}
          qrisUrl={state.qrisUrl}
          amount={totalPrice}
          productName={state.nominal?.name || 'SMM'}
        />
      )}
    </div>
  );
}
