'use client';

import { Clock, LogOut, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PendingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>('pending');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const supabase = createClient();

    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setUsername(user.user_metadata?.username || user.email?.split('@')[0] || 'User');

      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single();

      const st = profile?.status || 'pending';
      setStatus(st);

      // Jika sudah approved/active → redirect ke beranda
      if (st === 'approved' || st === 'active') {
        router.push('/');
        router.refresh();
      }
    };

    checkStatus();
    // Auto-check setiap 10 detik
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <Logo size={56} />

        {status === 'rejected' ? (
          <>
            <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-2xl">
              <ShieldCheck size={48} className="mx-auto text-red-500 mb-4" />
              <h1 className="text-xl font-bold text-red-800 font-[family-name:var(--font-heading)]">
                Akun Ditolak
              </h1>
              <p className="text-sm text-red-700 mt-2">
                Maaf, akun <strong>{username}</strong> telah ditolak oleh owner.
                Silakan hubungi admin untuk informasi lebih lanjut.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mt-6 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
              <Clock size={48} className="mx-auto text-amber-500 mb-4 animate-pulse" />
              <h1 className="text-xl font-bold text-amber-800 font-[family-name:var(--font-heading)]">
                Menunggu Persetujuan
              </h1>
              <p className="text-sm text-amber-700 mt-2">
                Hai <strong>{username}</strong>, akun kamu sudah terdaftar dan sedang menunggu
                persetujuan dari owner. Halaman ini akan otomatis refresh.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-amber-600">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </>
        )}

        <button
          onClick={handleLogout}
          className="mt-6 flex items-center justify-center gap-2 mx-auto px-6 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-on-surface-variant hover:text-error hover:border-error transition-colors"
        >
          <LogOut size={16} /> Keluar
        </button>

        <p className="text-xs text-on-surface-variant mt-4">
          © 2026 DAYA MART. All rights reserved.
        </p>
      </div>
    </div>
  );
}
