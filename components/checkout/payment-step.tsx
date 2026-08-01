'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Timer, Download, RefreshCw, HelpCircle, QrCode, CheckCircle2, XCircle } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface PaymentStepProps {
  orderId: string | null;
  qrisUrl: string | null;
  amount: number;
  productName: string;
}

export default function PaymentStep({ orderId, qrisUrl, amount, productName }: PaymentStepProps) {
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [status, setStatus] = useState<'waiting' | 'success' | 'failed' | 'expired'>('waiting');

  useEffect(() => {
    if (status !== 'waiting') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Poll status setiap 5 detik
  useEffect(() => {
    if (!orderId || status !== 'waiting') return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/status?orderId=${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.payment_status === 'paid') setStatus('success');
          else if (data.payment_status === 'failed') setStatus('failed');
          else if (data.payment_status === 'expired') setStatus('expired');
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);
    return () => clearInterval(poll);
  }, [orderId, status]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft < 120;

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto text-center py-12 animate-fade-in">
        <CheckCircle2 size={64} className="mx-auto mb-4 text-accent-green" />
        <h2 className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)]">Pembayaran Berhasil!</h2>
        <p className="text-sm text-on-surface-variant mt-2">Pesanan Anda sedang diproses. Cek riwayat transaksi di profil.</p>
        <Link href="/profil" className="inline-flex mt-6 px-6 py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all">
          Lihat Riwayat Transaksi
        </Link>
      </div>
    );
  }

  if (status === 'expired' || status === 'failed') {
    return (
      <div className="max-w-md mx-auto text-center py-12 animate-fade-in">
        <XCircle size={64} className="mx-auto mb-4 text-error" />
        <h2 className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)]">
          {status === 'expired' ? 'Waktu Habis' : 'Pembayaran Gagal'}
        </h2>
        <p className="text-sm text-on-surface-variant mt-2">Silakan coba lagi atau hubungi kami jika butuh bantuan.</p>
        <Link href="/" className="inline-flex mt-6 px-6 py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      {/* Timer */}
      <div className="bg-surface-container-high border border-outline-variant/30 rounded-xl p-6 flex flex-col items-center relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-primary-container/5 animate-pulse rounded-xl" />
        <h2 className="text-base font-bold text-on-surface mb-2 relative z-10 flex items-center gap-2 font-[family-name:var(--font-heading)]">
          <Timer size={20} className="text-primary" />
          Selesaikan Pembayaran Dalam
        </h2>
        <div className={`text-5xl font-extrabold tracking-tighter relative z-10 font-[family-name:var(--font-heading)] ${isLow ? 'text-error' : 'text-primary'}`}>
          {minutes}:{seconds < 10 ? '0' : ''}{seconds}
        </div>
      </div>

      {/* QRIS */}
      <div className="bg-surface-container-lowest rounded-xl p-8 flex flex-col items-center shadow-soft border border-outline-variant/20">
        <div className="flex items-center justify-between w-full mb-6 pb-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <QrCode size={24} className="text-primary" />
            <span className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">QRIS</span>
          </div>
          <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">GPN</span>
        </div>

        <div className="bg-white p-4 rounded-lg border-2 border-primary-container/20 shadow-inner mb-6">
          {qrisUrl ? (
            <img src={qrisUrl} alt="QRIS" className="w-64 h-64 object-contain" />
          ) : (
            <div className="w-64 h-64 bg-surface-container-high rounded flex items-center justify-center">
              <div className="text-center">
                <QrCode size={80} className="text-primary/30 mx-auto mb-2" />
                <p className="text-xs text-on-surface-variant">QR Code akan muncul<br />setelah integrasi Pakasir</p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center w-full mb-6">
          <p className="text-xs text-on-surface-variant mb-1">Total Pembayaran</p>
          <p className="text-3xl font-bold text-primary font-[family-name:var(--font-heading)]">{formatRupiah(amount)}</p>
          <p className="text-xs text-on-surface-variant mt-1">{productName}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button className="flex-1 py-3 px-6 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2">
            <Download size={16} /> Simpan QR Code
          </button>
          <button className="flex-1 py-3 px-6 rounded-full border-2 border-pink-500 text-pink-500 font-semibold text-sm hover:bg-pink-500/10 transition-colors flex items-center justify-center gap-2">
            <RefreshCw size={16} /> Cek Status
          </button>
        </div>
      </div>

      {/* Cara Bayar */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30 bg-surface-variant/50">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2 font-[family-name:var(--font-heading)]">
            <HelpCircle size={18} className="text-primary" /> Cara Bayar
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
  );
}
