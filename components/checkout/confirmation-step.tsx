'use client';

import { ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import type { CheckoutState } from '@/hooks/use-checkout';

interface ConfirmationStepProps {
  state: CheckoutState;
  onConfirm: () => void;
  onBack: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-on-surface text-right">{value}</span>
    </div>
  );
}

export default function ConfirmationStep({ state, onConfirm, onBack }: ConfirmationStepProps) {
  const { product, targetInput, duration, nominal } = state;
  const totalPrice = nominal?.price_sell || nominal?.price || 0;

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <h2 className="text-lg font-bold text-on-surface mb-4 font-[family-name:var(--font-heading)]">
        Konfirmasi Pesanan
      </h2>

      <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-5 space-y-3 shadow-soft">
        <Row label="Produk" value={product?.name || '-'} />
        {targetInput && <Row label="Nomor Tujuan" value={targetInput} />}
        {duration && <Row label="Durasi" value={duration.label} />}
        {nominal && <Row label="Nominal" value={nominal.name || nominal.label || '-'} />}

        <div className="border-t border-outline-variant/30 pt-3 flex justify-between items-center">
          <span className="font-semibold text-on-surface">Total Bayar</span>
          <span className="font-bold text-primary text-lg font-[family-name:var(--font-heading)]">
            {formatRupiah(totalPrice)}
          </span>
        </div>
      </div>

      {state.error && (
        <div className="mt-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm">
          {state.error}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-on-surface-variant mt-4">
        <ShieldCheck size={16} className="text-accent-green shrink-0" />
        Periksa kembali data Anda. Pesanan diproses otomatis setelah pembayaran.
      </p>

      <div className="flex gap-3 mt-6">
        <button onClick={onBack}
          className="flex-1 py-3 rounded-full border-2 border-primary text-primary font-semibold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors">
          <ArrowLeft size={18} /> Ubah
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-3 rounded-full gradient-primary text-white font-semibold flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-all">
          Konfirmasi & Bayar <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
