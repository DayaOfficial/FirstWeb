'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Wallet, RefreshCw, AlertTriangle, TrendingUp,
  Clock, ArrowUpRight, Loader2
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface BalanceData {
  provider: 'digiflazz' | 'jokerpanel';
  balance: number;
  currency: string;
  error?: string;
}

const MIN_THRESHOLDS: Record<string, number> = {
  digiflazz: 100000,
  jokerpanel: 50,
};

const PROVIDER_LABELS: Record<string, string> = {
  digiflazz: 'Digiflazz',
  jokerpanel: 'JokerPanel',
};

export default function SaldoProviderPage() {
  const [balances, setBalances] = useState<BalanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshingProvider, setRefreshingProvider] = useState<string | null>(null);

  const refresh = useCallback(async (provider?: string) => {
    if (provider) {
      setRefreshingProvider(provider);
    } else {
      setLoading(true);
    }

    try {
      const url = `/api/owner/balance${provider ? `?provider=${provider}` : ''}`;
      const res = await fetch(url);
      const { balances: b } = await res.json();

      if (provider) {
        // Update hanya provider yang di-refresh
        setBalances(prev =>
          prev.map(existing =>
            existing.provider === provider
              ? (b.find((n: BalanceData) => n.provider === provider) ?? existing)
              : existing
          )
        );
      } else {
        setBalances(b ?? []);
      }

      setLastUpdated(new Date());
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshingProvider(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function isLow(b: BalanceData) {
    const min = MIN_THRESHOLDS[b.provider] ?? 0;
    return b.balance < min;
  }

  function formatBalance(b: BalanceData) {
    if (b.currency === 'IDR') return formatRupiah(b.balance);
    return `$ ${Number(b.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Wallet size={28} className="text-primary" />
            Saldo Provider
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Pantau saldo deposit Digiflazz & JokerPanel secara real-time
          </p>
        </div>
        <button
          onClick={() => refresh()}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Perbarui Semua
        </button>
      </div>

      {/* Kartu Saldo */}
      {loading && balances.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {balances.map((b) => (
            <div
              key={b.provider}
              className={`relative rounded-2xl border overflow-hidden shadow-soft transition-all ${
                b.error
                  ? 'border-amber-300 bg-amber-50/50'
                  : isLow(b)
                    ? 'border-error/30 bg-error/5'
                    : 'border-outline-variant/30 bg-surface-container-lowest'
              }`}
            >
              {/* Gradient accent top */}
              <div
                className="h-1.5"
                style={{
                  background: b.error
                    ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                    : isLow(b)
                      ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                      : 'linear-gradient(90deg, #C0003A, #FF1A5E)',
                }}
              />

              <div className="p-6">
                {/* Provider label */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                      b.provider === 'digiflazz' ? 'bg-blue-600' : 'bg-purple-600'
                    }`}>
                      {b.provider === 'digiflazz' ? 'DF' : 'JP'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">
                        {PROVIDER_LABELS[b.provider]}
                      </p>
                      <p className="text-xs text-on-surface-variant">{b.currency}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => refresh(b.provider)}
                    disabled={refreshingProvider === b.provider}
                    className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-primary disabled:opacity-50"
                    title="Perbarui saldo ini"
                  >
                    <RefreshCw
                      size={16}
                      className={refreshingProvider === b.provider ? 'animate-spin' : ''}
                    />
                  </button>
                </div>

                {/* Saldo */}
                {b.error ? (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-100/50 border border-amber-200">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Tidak dapat terhubung</p>
                      <p className="text-xs text-amber-700 mt-0.5">{b.error}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-on-surface font-[family-name:var(--font-heading)] tracking-tight">
                      {formatBalance(b)}
                    </p>

                    {/* Peringatan saldo rendah */}
                    {isLow(b) && (
                      <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-error/10 border border-error/20">
                        <AlertTriangle size={16} className="text-error shrink-0" />
                        <p className="text-xs text-error font-medium">
                          Saldo di bawah batas aman (
                          {b.currency === 'IDR'
                            ? formatRupiah(MIN_THRESHOLDS[b.provider])
                            : `$${MIN_THRESHOLDS[b.provider]}`}
                          ) — segera deposit!
                        </p>
                      </div>
                    )}

                    {/* Status sehat */}
                    {!isLow(b) && (
                      <div className="flex items-center gap-1.5 mt-3 text-accent-green">
                        <TrendingUp size={14} />
                        <span className="text-xs font-semibold">Saldo aman</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info saldo kosong */}
      {!loading && balances.length === 0 && (
        <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
          <Wallet size={48} className="mx-auto mb-4 text-on-surface-variant/30" />
          <p className="text-sm text-on-surface-variant font-semibold">Belum ada data saldo.</p>
          <p className="text-xs text-on-surface-variant mt-1">Pastikan API key Digiflazz dan JokerPanel sudah dikonfigurasi.</p>
        </div>
      )}

      {/* Info footer */}
      <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-5">
        <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
          <Clock size={16} className="text-primary" />
          Informasi Sinkronisasi
        </h3>
        <div className="space-y-2 text-xs text-on-surface-variant">
          <p className="flex items-center gap-2">
            <ArrowUpRight size={12} className="text-primary shrink-0" />
            Saldo diperbarui otomatis <strong>setiap jam</strong> via cron job.
          </p>
          <p className="flex items-center gap-2">
            <ArrowUpRight size={12} className="text-primary shrink-0" />
            Saldo Digiflazz juga ter-update otomatis dari <code className="bg-surface-container-high px-1.5 py-0.5 rounded text-[11px]">buyer_last_saldo</code> setiap transaksi.
          </p>
          <p className="flex items-center gap-2">
            <ArrowUpRight size={12} className="text-primary shrink-0" />
            Notifikasi akan dikirim jika saldo di bawah batas aman.
          </p>
          {lastUpdated && (
            <p className="pt-2 border-t border-outline-variant/30 text-on-surface-variant/70">
              Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
