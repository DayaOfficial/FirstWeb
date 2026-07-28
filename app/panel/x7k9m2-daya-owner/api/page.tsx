'use client';

import { Link2, CheckCircle2, AlertCircle, Settings } from 'lucide-react';

export default function OwnerApiPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
          <Link2 size={28} className="text-primary" />
          Koneksi API
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">Kelola koneksi ke provider layanan digital.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Digiflazz */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">DF</div>
              <div>
                <h3 className="font-bold text-sm text-on-surface">Digiflazz</h3>
                <p className="text-xs text-on-surface-variant">Pulsa, Data, Token, Voucher</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-semibold border border-green-200">
              <CheckCircle2 size={12} /> Terhubung
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-on-surface-variant">Username</span><span className="font-mono text-xs text-on-surface">tuwumiWXAdqg</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">API Key</span><span className="font-mono text-xs text-on-surface">dev-b8bd••••••</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Mode</span><span className="font-semibold text-amber-600">Development</span></div>
          </div>
          <button className="mt-4 w-full py-2 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
            <Settings size={14} /> Konfigurasi
          </button>
        </div>

        {/* JokerPanel */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">JP</div>
              <div>
                <h3 className="font-bold text-sm text-on-surface">JokerPanel</h3>
                <p className="text-xs text-on-surface-variant">SMM Panel Services</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-semibold border border-green-200">
              <CheckCircle2 size={12} /> Terhubung
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-on-surface-variant">Base URL</span><span className="font-mono text-xs text-on-surface">jokerpanel.com/api/v2</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">API Key</span><span className="font-mono text-xs text-on-surface">2nqgf5-••••••</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Status</span><span className="font-semibold text-green-600">Active</span></div>
          </div>
          <button className="mt-4 w-full py-2 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
            <Settings size={14} /> Konfigurasi
          </button>
        </div>

        {/* Pakasir QRIS */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">PK</div>
              <div>
                <h3 className="font-bold text-sm text-on-surface">Pakasir (QRIS)</h3>
                <p className="text-xs text-on-surface-variant">Payment Gateway</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-semibold border border-amber-200">
              <AlertCircle size={12} /> Belum Dikonfigurasi
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-on-surface-variant">Merchant Code</span><span className="font-mono text-xs text-on-surface-variant">-</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">API Key</span><span className="font-mono text-xs text-on-surface-variant">-</span></div>
          </div>
          <button className="mt-4 w-full py-2 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
            <Settings size={14} /> Konfigurasi
          </button>
        </div>
      </div>
    </div>
  );
}
