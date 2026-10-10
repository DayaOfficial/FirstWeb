'use client';

import { useState } from 'react';
import { useCheckout } from '@/hooks/use-checkout';
import ConfirmationStep from '@/components/checkout/confirmation-step';
import PaymentStep from '@/components/checkout/payment-step';
import BrandImage from '@/components/ui/BrandImage';
import { formatRupiah } from '@/lib/utils';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, User } from 'lucide-react';
import Link from 'next/link';

interface GameInfo {
  name: string;
  slug: string;
  image: string;
  currency: string;
  gameKey?: string;
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

  // Validation state
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    username?: string;
    error?: string;
    warning?: string;
  } | null>(null);

  const fields = inputSchema?.fields ?? [];

  function buildCustomerNo() {
    let fmt = inputSchema?.format_customer_no ?? '';
    for (const f of fields) {
      fmt = fmt.replace(`{${f.key}}`, inputs[f.key] ?? '');
    }
    return fmt;
  }

  const allFieldsFilled = fields.every(f => !f.required || (inputs[f.key] && inputs[f.key].trim()));

  // Validasi ID game sebelum lanjut
  async function validateAndProceed() {
    if (!allFieldsFilled) return;

    setValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/validate-game-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_key: game.gameKey || game.slug,
          fields: inputs,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        setValidationResult({
          valid: true,
          username: data.username,
          warning: data.warning,
        });
        // Auto-proceed setelah 1 detik jika valid
        setTimeout(() => {
          actions.submitInput(buildCustomerNo());
        }, data.username ? 1500 : 500);
      } else {
        setValidationResult({
          valid: false,
          error: data.error || 'Akun tidak ditemukan',
        });
      }
    } catch {
      // API error → izinkan lanjut dengan warning
      setValidationResult({
        valid: true,
        warning: 'Validasi tidak tersedia. Pastikan ID benar.',
      });
      setTimeout(() => {
        actions.submitInput(buildCustomerNo());
      }, 1000);
    }

    setValidating(false);
  }

  // Reset validasi saat input berubah
  function handleInputChange(key: string, value: string) {
    setInputs({ ...inputs, [key]: value });
    if (validationResult) setValidationResult(null);
  }

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
                    onChange={e => handleInputChange(f.key, e.target.value)}
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
                    onChange={e => handleInputChange(f.key, e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                )}
                {f.helper && <p className="text-xs text-on-surface-variant mt-1">{f.helper}</p>}
              </div>
            ))}
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className={`mt-4 p-4 rounded-xl border animate-fade-in ${
              validationResult.valid
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              {validationResult.valid ? (
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                  <div>
                    {validationResult.username ? (
                      <>
                        <p className="text-sm font-semibold text-green-800">Akun ditemukan!</p>
                        <div className="flex items-center gap-2 mt-1">
                          <User size={14} className="text-green-600" />
                          <span className="text-sm font-bold text-green-700">{validationResult.username}</span>
                        </div>
                      </>
                    ) : validationResult.warning ? (
                      <p className="text-sm text-amber-700">{validationResult.warning}</p>
                    ) : (
                      <p className="text-sm text-green-700">ID valid, melanjutkan...</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Akun tidak ditemukan</p>
                    <p className="text-xs text-red-600 mt-0.5">{validationResult.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {state.error && (
            <p className="text-sm text-error mt-3">{state.error}</p>
          )}

          <button
            disabled={!allFieldsFilled || validating}
            onClick={validateAndProceed}
            className="mt-5 px-6 py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {validating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Memvalidasi ID...
              </>
            ) : (
              'Cek Akun & Lanjut'
            )}
          </button>
        </section>
      )}

      {/* Step 2: Nominal */}
      {state.step === 'nominal' && (
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-soft">
          <StepTitle n={2} title={`Pilih Jumlah ${game.currency}`} />

          {/* Info akun */}
          <div className="mb-4 p-3 rounded-xl bg-surface-container-high text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-on-surface-variant">ID:</span>
              <span className="font-semibold text-on-surface">{state.targetInput}</span>
              {validationResult?.username && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200">
                  <User size={10} />
                  {validationResult.username}
                </span>
              )}
            </div>
            <button onClick={() => { actions.back(); setValidationResult(null); }} className="text-primary text-xs font-semibold hover:underline">Ubah</button>
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
          qrString={state.qrString}
          testMode={state.testMode}
          amount={state.nominal?.price_sell || state.nominal?.price || 0}
          productName={`${game.name} — ${state.nominal?.name}`}
        />
      )}
    </div>
  );
}
