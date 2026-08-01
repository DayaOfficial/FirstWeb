'use client';

import { useState } from 'react';
import { useCheckout } from '@/hooks/use-checkout';
import ConfirmationStep from '@/components/checkout/confirmation-step';
import PaymentStep from '@/components/checkout/payment-step';
import BrandImage from '@/components/ui/BrandImage';
import { formatRupiah } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface GameInfo {
  name: string;
  slug: string;
  image: string;
  currency: string;
}

interface InputField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  helper?: string;
  options?: string[];
}

interface InputSchema {
  fields: InputField[];
  format_customer_no: string;
}

interface NominalItem {
  id: string;
  name: string;
  price_sell: number;
  buyer_sku_code: string;
}

interface GameTopUpFlowProps {
  game: GameInfo;
  nominals: NominalItem[];
  inputSchema: InputSchema | null;
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="flex items-center gap-2 font-bold mb-3 font-[family-name:var(--font-heading)] text-on-surface">
      <span className="w-7 h-7 rounded-full gradient-primary text-white text-sm flex items-center justify-center font-bold">{n}</span>
      {title}
    </h2>
  );
}

export default function GameTopUpFlow({ game, nominals, inputSchema }: GameTopUpFlowProps) {
  const { state, actions } = useCheckout({ name: game.name, needs_target: true, id: nominals[0]?.id });
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const fields = inputSchema?.fields ?? [];

  function buildCustomerNo() {
    let fmt = inputSchema?.format_customer_no ?? '';
    for (const f of fields) {
      fmt = fmt.replace(`{${f.key}}`, inputs[f.key] ?? '');
    }
    return fmt;
  }

  const allFieldsFilled = fields.every(f => !f.required || (inputs[f.key] && inputs[f.key].trim()));

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back + Header */}
      <Link href="/topup-game" className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
        <ArrowLeft size={16} /> Kembali ke Daftar Game
      </Link>

      <div className="flex items-center gap-4">
        <BrandImage src={game.image} alt={game.name} size={64} rounded={16} />
        <div>
          <h1 className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)]">{game.name}</h1>
          <p className="text-sm text-primary font-semibold">{game.currency}</p>
        </div>
      </div>

      {/* Step 1: Input */}
      {state.step === 'input' && (
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-soft">
          <StepTitle n={1} title="Masukkan Data Akun" />
          <div className="grid sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-sm font-semibold text-on-surface">{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    onChange={e => setInputs({ ...inputs, [f.key]: e.target.value })}
                    value={inputs[f.key] || ''}
                    className="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  >
                    <option value="">Pilih {f.label}</option>
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : 'text'}
                    placeholder={f.placeholder}
                    value={inputs[f.key] || ''}
                    onChange={e => setInputs({ ...inputs, [f.key]: e.target.value })}
                    className="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                )}
                {f.helper && <p className="text-xs text-on-surface-variant mt-1">{f.helper}</p>}
              </div>
            ))}
          </div>
          {state.error && (
            <p className="text-sm text-error mt-3">{state.error}</p>
          )}
          <button
            disabled={!allFieldsFilled}
            onClick={() => actions.submitInput(buildCustomerNo())}
            className="mt-5 px-6 py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Lanjut Pilih Nominal
          </button>
        </section>
      )}

      {/* Step 2: Nominal */}
      {state.step === 'nominal' && (
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-soft">
          <StepTitle n={2} title={`Pilih Jumlah ${game.currency}`} />

          {/* Info akun */}
          <div className="mb-4 p-3 rounded-xl bg-surface-container-high text-sm">
            <span className="text-on-surface-variant">ID: </span>
            <span className="font-semibold text-on-surface">{state.targetInput}</span>
            <button onClick={actions.back} className="ml-3 text-primary text-xs font-semibold hover:underline">Ubah</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {nominals.map((n) => (
              <button
                key={n.id}
                onClick={() => actions.selectNominal({
                  id: n.id,
                  name: n.name,
                  price: n.price_sell,
                  price_sell: n.price_sell,
                  buyer_sku_code: n.buyer_sku_code,
                })}
                className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                  state.nominal?.id === n.id
                    ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(192,0,58,0.15)]'
                    : 'border-outline-variant/30 hover:border-pink-300'
                }`}
              >
                <p className="font-semibold text-sm text-on-surface">{n.name}</p>
                <p className="text-primary font-bold mt-1 font-[family-name:var(--font-heading)]">
                  {formatRupiah(n.price_sell)}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 3: Confirm */}
      {state.step === 'confirm' && (
        <ConfirmationStep
          state={{
            ...state,
            product: { name: `${game.name} — ${state.nominal?.name}` },
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
          productName={`${game.name} — ${state.nominal?.name}`}
        />
      )}
    </div>
  );
}
