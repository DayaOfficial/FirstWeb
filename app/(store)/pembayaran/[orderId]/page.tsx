'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import PaymentStep from '@/components/checkout/payment-step';

export default function ResumePembayaranPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<{
    orderId: string;
    orderCode: string;
    productName: string;
    amount: number;
    qrString: string | null;
    expiresAt: string;
  } | null>(null);

  useEffect(() => {
    if (!orderId) return;

    (async () => {
      try {
        const res = await fetch(`/api/orders/resume?orderId=${orderId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 410) {
            setError('Waktu pembayaran sudah habis. Silakan buat pesanan baru.');
          } else {
            setError(data.error || 'Gagal memuat data pembayaran.');
          }
          setLoading(false);
          return;
        }
        const data = await res.json();
        setOrderData(data);
      } catch {
        setError('Terjadi kesalahan jaringan.');
      }
      setLoading(false);
    })();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Loader2 size={32} className="animate-spin text-primary mb-4" />
        <p className="text-sm text-on-surface-variant">Memuat data pembayaran...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-16 animate-fade-in">
        <AlertCircle size={56} className="mx-auto mb-4 text-error" />
        <h2 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)] mb-2">
          Tidak Dapat Melanjutkan
        </h2>
        <p className="text-sm text-on-surface-variant mb-6">{error}</p>
        <Link
          href="/profil"
          className="inline-flex px-6 py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all"
        >
          Kembali ke Profil
        </Link>
      </div>
    );
  }

  if (!orderData) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <Link href="/profil" className="hover:text-primary transition-colors">Profil</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">Lanjutkan Pembayaran</span>
      </nav>

      <div className="bg-surface-container-high/50 border border-outline-variant/30 rounded-xl p-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <div>
          <p className="text-sm font-semibold text-on-surface">
            Melanjutkan pembayaran untuk: <span className="text-primary">{orderData.productName}</span>
          </p>
          <p className="text-xs text-on-surface-variant">Kode: {orderData.orderCode}</p>
        </div>
      </div>

      <PaymentStep
        orderId={orderData.orderId}
        qrisUrl={null}
        qrString={orderData.qrString}
        testMode={false}
        amount={orderData.amount}
        productName={orderData.productName}
        expiresAt={orderData.expiresAt}
      />
    </div>
  );
}
