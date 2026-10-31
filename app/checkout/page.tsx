'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Timer, Download, RefreshCw, HelpCircle, Lock, ShieldCheck, QrCode } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export default function CheckoutPage() {
  const [timeLeft, setTimeLeft] = useState(15 * 60 - 1);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft < 120;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-10 px-4 md:px-10">
      {/* Header */}
      <header className="w-full max-w-[1280px] flex items-center justify-center mb-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-base font-[family-name:var(--font-heading)]">D</div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-primary tracking-tight font-[family-name:var(--font-heading)]">DAYA MART</span>
            <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Secure Checkout</span>
          </div>
        </Link>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        {/* Left: Payment */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Timer */}
          <div className="bg-surface-container-high border border-outline-variant/30 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
            <div className="absolute inset-0 bg-primary-container/5 animate-pulse rounded-xl" />
            <h2 className="text-base font-bold text-on-surface mb-2 relative z-10 flex items-center gap-2 font-[family-name:var(--font-heading)]">
              <Timer size={20} className="text-primary" />
              Selesaikan Pembayaran Dalam
            </h2>
            <div className={`text-5xl font-extrabold tracking-tighter relative z-10 font-[family-name:var(--font-heading)] ${isLow ? 'text-error' : 'text-primary'}`}>
              {minutes}:{seconds < 10 ? '0' : ''}{seconds}
            </div>
            <p className="text-xs text-on-surface-variant mt-2 text-center relative z-10">
              Selesaikan pembayaran sebelum waktu habis untuk mengamankan pesanan Anda.
            </p>
          </div>

          {/* QRIS */}
          <div className="bg-surface-container-lowest rounded-xl p-8 flex flex-col items-center shadow-soft border border-outline-variant/20 hover:shadow-[0px_8px_30px_rgba(192,0,58,0.12)] transition-shadow duration-300">
            <div className="flex items-center justify-between w-full mb-6 pb-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <QrCode size={24} className="text-primary" />
                <span className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">QRIS</span>
              </div>
              <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">GPN</span>
            </div>

            <div className="bg-white p-4 rounded-lg border-2 border-primary-container/20 shadow-inner mb-6 relative group">
              <div className="w-64 h-64 bg-surface-container-high rounded flex items-center justify-center">
                <div className="text-center">
                  <QrCode size={80} className="text-primary/30 mx-auto mb-2" />
                  <p className="text-xs text-on-surface-variant">QR Code akan muncul<br />setelah integrasi Pakasir</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg backdrop-blur-[2px]">
                <QrCode size={40} className="text-white animate-bounce" />
              </div>
            </div>

            <div className="text-center w-full mb-8">
              <p className="text-xs text-on-surface-variant mb-1">Total Pembayaran</p>
              <p className="text-3xl font-bold text-primary font-[family-name:var(--font-heading)]">Rp 151.500</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button className="flex-1 py-3 px-6 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2">
                <Download size={16} />
                Simpan QR Code
              </button>
              <button className="flex-1 py-3 px-6 rounded-full border-2 border-pink-500 text-pink-500 font-semibold text-sm hover:bg-pink-500/10 transition-colors flex items-center justify-center gap-2">
                <RefreshCw size={16} />
                Cek Status
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden">
            <div className="p-4 border-b border-outline-variant/30 bg-surface-variant/50">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2 font-[family-name:var(--font-heading)]">
                <HelpCircle size={18} className="text-primary" />
                Cara Bayar
              </h3>
            </div>
            <div className="p-5 bg-surface-container-lowest">
              <ol className="list-decimal list-inside space-y-3 text-sm text-on-surface-variant">
                <li>Buka aplikasi e-wallet atau m-banking yang mendukung QRIS (GoPay, OVO, Dana, BCA mobile, dll).</li>
                <li>Pilih menu <strong>Scan QR</strong> atau <strong>Bayar</strong>.</li>
                <li>Scan QR code yang ditampilkan di atas, atau upload dari galeri jika sudah disimpan.</li>
                <li>Pastikan nama merchant adalah <strong>DAYA MART</strong> dan jumlah sesuai.</li>
                <li>Konfirmasi pembayaran di aplikasi Anda. Status akan terupdate otomatis.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="sticky top-6 bg-surface-container-lowest rounded-xl shadow-soft border border-outline-variant/20 p-6 flex flex-col h-fit">
            <h3 className="text-base font-bold text-on-surface border-b border-outline-variant/30 pb-4 mb-4 font-[family-name:var(--font-heading)]">Ringkasan Pesanan</h3>

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-surface-container overflow-hidden shrink-0 gradient-primary flex items-center justify-center">
                  <span className="text-white font-bold text-lg">ML</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface">Mobile Legends — 277 Diamonds</p>
                  <p className="text-xs text-on-surface-variant mt-1">ID: 12345678 (1234)</p>
                  <p className="text-sm font-bold text-primary mt-1">{formatRupiah(75000)}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-surface-container overflow-hidden shrink-0 bg-green-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">SP</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface">Spotify Premium — 1 Bulan</p>
                  <p className="text-xs text-on-surface-variant mt-1">Account: user@example.com</p>
                  <p className="text-sm font-bold text-primary mt-1">{formatRupiah(75000)}</p>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-outline-variant/30 my-4" />

            <div className="flex flex-col gap-2 mb-6 text-sm">
              <div className="flex justify-between text-on-surface-variant"><span>Subtotal</span><span>{formatRupiah(150000)}</span></div>
              <div className="flex justify-between text-on-surface-variant"><span>Platform Fee</span><span>{formatRupiah(1000)}</span></div>
              <div className="flex justify-between text-on-surface-variant"><span>QRIS Processing</span><span>{formatRupiah(500)}</span></div>
            </div>

            <div className="w-full border-t-2 border-dashed border-outline-variant/30 my-4" />

            <div className="flex justify-between items-center mt-2">
              <span className="text-base font-bold text-on-surface font-[family-name:var(--font-heading)]">Total</span>
              <span className="text-xl font-bold text-primary font-[family-name:var(--font-heading)]">{formatRupiah(151500)}</span>
            </div>

            <div className="mt-8 pt-4 border-t border-outline-variant/20 flex items-center justify-center gap-4 text-on-surface-variant">
              <div className="flex items-center gap-1">
                <Lock size={14} />
                <span className="text-xs font-semibold">Secure Payment</span>
              </div>
              <div className="w-1 h-1 bg-outline rounded-full" />
              <div className="flex items-center gap-1">
                <ShieldCheck size={14} />
                <span className="text-xs font-semibold">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-[1280px] text-center py-10 mt-10 border-t border-outline-variant/20">
        <p className="text-xs text-on-surface-variant">© 2026 DAYA MART. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/bantuan" className="text-xs text-primary hover:underline">Syarat Layanan</Link>
          <Link href="/bantuan" className="text-xs text-primary hover:underline">Kebijakan Privasi</Link>
          <a href="https://wa.me/6287800001232" className="text-xs text-primary hover:underline">Hubungi Kami</a>
        </div>
      </footer>
    </div>
  );
}
