'use client';

import { useState } from 'react';

export type CheckoutStep = 'input' | 'nominal' | 'confirm' | 'payment' | 'result';

export interface CheckoutProduct {
  id?: string;
  name: string;
  needs_target?: boolean;
  category?: string;
}

export interface NominalOption {
  id?: string;
  name: string;
  label?: string;
  price: number;
  price_sell?: number;
  provider_code?: string;
  buyer_sku_code?: string;
}

export interface CheckoutState {
  step: CheckoutStep;
  product: CheckoutProduct | null;
  targetInput: string;
  duration: { value: number; unit: 'hari' | 'bulan'; label: string } | null;
  nominal: NominalOption | null;
  buyerName: string;
  buyerPhone: string;
  orderId: string | null;
  qrisUrl: string | null;
  error: string | null;
}

export function useCheckout(product: CheckoutProduct | null) {
  const [state, setState] = useState<CheckoutState>({
    step: product?.needs_target ? 'input' : 'nominal',
    product,
    targetInput: '',
    duration: null,
    nominal: null,
    buyerName: '',
    buyerPhone: '',
    orderId: null,
    qrisUrl: null,
    error: null,
  });

  const go = (patch: Partial<CheckoutState>) =>
    setState(s => ({ ...s, ...patch }));

  const actions = {
    submitInput(target: string, duration?: CheckoutState['duration']) {
      if (product?.needs_target && !target.trim()) {
        go({ error: 'Isi nomor tujuan dulu' });
        return;
      }
      go({ targetInput: target, duration: duration ?? null, step: 'nominal', error: null });
    },

    selectNominal(nominal: NominalOption) {
      // PENTING: pilih nominal → ke CONFIRM, BUKAN ke payment
      go({ nominal, step: 'confirm', error: null });
    },

    async confirmAndPay() {
      go({ step: 'payment', error: null });

      try {
        const res = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: state.product?.id,
            product_name: state.product?.name,
            target_input: state.targetInput,
            duration: state.duration,
            nominal_code: state.nominal?.buyer_sku_code || state.nominal?.provider_code,
            nominal_name: state.nominal?.name,
            amount: state.nominal?.price_sell || state.nominal?.price,
            buyer_name: state.buyerName,
            buyer_phone: state.buyerPhone,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Gagal membuat pesanan' }));
          go({ error: err.error || 'Gagal membuat pesanan', step: 'confirm' });
          return;
        }

        const data = await res.json();
        go({ orderId: data.orderId, qrisUrl: data.qrisUrl, step: 'payment' });
      } catch {
        go({ error: 'Koneksi gagal. Coba lagi.', step: 'confirm' });
      }
    },

    back() {
      const order: CheckoutStep[] = ['input', 'nominal', 'confirm', 'payment', 'result'];
      const idx = order.indexOf(state.step);
      if (idx > 0) {
        // Jika product tidak perlu input, skip step 'input'
        const prevStep = order[idx - 1];
        if (prevStep === 'input' && !product?.needs_target) {
          // Tidak bisa mundur lebih jauh
          return;
        }
        go({ step: prevStep, error: null });
      }
    },

    setField(field: 'buyerName' | 'buyerPhone', value: string) {
      go({ [field]: value } as Partial<CheckoutState>);
    },

    reset() {
      setState({
        step: product?.needs_target ? 'input' : 'nominal',
        product,
        targetInput: '',
        duration: null,
        nominal: null,
        buyerName: '',
        buyerPhone: '',
        orderId: null,
        qrisUrl: null,
        error: null,
      });
    },
  };

  return { state, go, actions };
}
