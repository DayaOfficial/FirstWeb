'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Gamepad2, Loader2 } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useCheckout } from '@/hooks/use-checkout';
import ConfirmationStep from '@/components/checkout/confirmation-step';
import PaymentStep from '@/components/checkout/payment-step';

interface RobuxPackage {
  id: string;
  name: string;
  price_sell: number;
  image_url: string | null;
}

export default function RobuxVilogPage() {
  const supabase = createClient();
  const { state, go } = useCheckout({ name: 'Robux Vilog', needs_target: false });
  const [packages, setPackages] = useState<RobuxPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RobuxPackage | null>(null);
  const [form, setForm] = useState({ nameUser: '', credential: '', password: '', backupCodes: '' });
  const [step, setStep] = useState<'select' | 'confirm' | 'payment'>('select');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, price_sell, image_url')
        .eq('module', 'manual_robux')
        .eq('is_active', true)
        .order('price_sell', { ascending: true });

      setPackages((data ?? []).map(p => ({
        id: p.id,
        name: p.name,
        price_sell: Number(p.price_sell),
        image_url: p.image_url,
      })));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const price = selected?.price_sell || 0;
  const targetInput = `${form.nameUser} | ${form.credential}`;

  return (
    <div className="space-y-8 animate-fade-in">
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <Link href="/topup-game" className="hover:text-primary transition-colors">Top Up Game</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">Robux Vilog</span>
      </nav>

      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
          <Gamepad2 size={28} /> Robux Vilog
        </h1>
        <p className="text-sm text-on-surface-variant mt-2">Topup Robux via Login — Owner login langsung ke akun Anda untuk mengisi Robux.</p>
      </div>

      {step === 'select' && (
        <>
          {/* Package Selection */}
          <div>
            <h2 className="text-lg font-bold text-on-surface mb-3 font-[family-name:var(--font-heading)]">Pilih Paket Robux</h2>
            {packages.length === 0 ? (
              <p className="text-center text-sm text-on-surface-variant py-8">
                Belum ada paket Robux tersedia. Owner perlu menambahkan di panel.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {packages.map(pkg => (
                  <button key={pkg.id} onClick={() => setSelected(pkg)}
                    className={`rounded-xl p-4 border-2 text-center transition-all ${selected?.id === pkg.id ? 'border-primary bg-primary/5 shadow-md' : 'border-outline-variant/30 bg-surface-container-lowest shadow-soft hover:border-primary/50'}`}>
                    <p className="text-2xl font-bold text-on-surface font-[family-name:var(--font-heading)]">{pkg.name}</p>
                    <p className="text-sm font-bold text-primary mt-1">{formatRupiah(pkg.price_sell)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          {selected && (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-soft border border-outline-variant/30 space-y-4">
              <h2 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">Data Akun Roblox</h2>
              <p className="text-xs text-on-surface-variant">Data Anda aman dan hanya digunakan untuk proses topup.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">Name + Username Roblox</label>
                  <input type="text" value={form.nameUser} onChange={e => setForm({...form, nameUser: e.target.value})} placeholder="Name + Username"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">Username / Email / Ponsel</label>
                  <input type="text" value={form.credential} onChange={e => setForm({...form, credential: e.target.value})} placeholder="Login credential"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">Password</label>
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Password akun"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">3 Kode Backup</label>
                  <input type="text" value={form.backupCodes} onChange={e => setForm({...form, backupCodes: e.target.value})} placeholder="Kode1, Kode2, Kode3"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-high flex justify-between text-sm">
                <span className="text-on-surface-variant">Total</span>
                <span className="font-bold text-primary">{formatRupiah(price)}</span>
              </div>

              <button
                disabled={!form.nameUser.trim() || !form.credential.trim() || !form.password.trim()}
                onClick={() => {
                  go({
                    nominal: { id: selected.id, name: selected.name, price, price_sell: price },
                    targetInput,
                    product: { name: 'Robux Vilog' },
                  });
                  setStep('confirm');
                }}
                className={`w-full py-3 rounded-full text-white text-sm font-semibold text-center transition-all gradient-primary hover:opacity-90 disabled:opacity-40`}>
                Konfirmasi &amp; Bayar {formatRupiah(price)}
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirm */}
      {step === 'confirm' && (
        <ConfirmationStep
          state={{
            ...state,
            product: { name: 'Robux Vilog' },
            nominal: { id: selected?.id, name: selected?.name || '', price, price_sell: price },
            targetInput,
          }}
          onConfirm={async () => {
            setStep('payment');
            try {
              const res = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  product_id: selected?.id,
                  product_name: `Robux Vilog — ${selected?.name}`,
                  target_input: targetInput,
                  amount: price,
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
          onBack={() => setStep('select')}
        />
      )}

      {/* Payment */}
      {step === 'payment' && (
        <PaymentStep
          orderId={state.orderId}
          qrisUrl={state.qrisUrl}
          amount={price}
          productName={`Robux Vilog — ${selected?.name}`}
        />
      )}
    </div>
  );
}
