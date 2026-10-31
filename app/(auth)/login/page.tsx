'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'pending' | 'rejected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setErrorMsg('');

    if (!usernameOrEmail.trim() || !password.trim()) {
      setStatus('error');
      setErrorMsg('Semua field wajib diisi.');
      return;
    }

    setStatus('loading');

    try {
      const supabase = createClient();

      // Determine if input is email or username
      let email = usernameOrEmail.trim();
      if (!email.includes('@')) {
        // Username login — look up email via API (bypass RLS)
        const lookupRes = await fetch('/api/auth/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email }),
        });

        if (!lookupRes.ok) {
          setStatus('error');
          setErrorMsg('Username tidak ditemukan.');
          return;
        }
        const lookupData = await lookupRes.json();
        email = lookupData.email;
      }

      // Supabase Auth sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setStatus('error');
        setErrorMsg('Email/username atau password salah.');
        return;
      }

      // Check profile status via API (bypass RLS)
      if (data.user) {
        const statusRes = await fetch('/api/auth/check-status');
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          
          if (statusData.status === 'pending') {
            setStatus('pending');
            return;
          }
          if (statusData.status === 'rejected') {
            await supabase.auth.signOut();
            setStatus('rejected');
            return;
          }
        }
      }

      // Login successful
      router.push('/');
      router.refresh();
    } catch {
      setStatus('error');
      setErrorMsg('Terjadi kesalahan. Pastikan koneksi internet Anda stabil.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo size={48} />
          </Link>
          <h1 className="text-2xl font-bold text-primary mt-4 font-[family-name:var(--font-heading)]">Masuk ke DAYA MART</h1>
          <p className="text-sm text-on-surface-variant mt-1">Masukkan kredensial Anda untuk melanjutkan</p>
        </div>

        {/* Status Messages */}
        {status === 'pending' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-fade-in">
            <Clock size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Menunggu Persetujuan</p>
              <p className="text-xs text-amber-700 mt-1">Akun Anda belum disetujui oleh owner. Silakan hubungi owner melalui WhatsApp untuk mempercepat proses.</p>
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
            <XCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Akun Ditolak</p>
              <p className="text-xs text-red-700 mt-1">Maaf, pendaftaran akun Anda ditolak oleh owner. Hubungi owner untuk informasi lebih lanjut.</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
            <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-soft border border-outline-variant/30">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Email atau Username</label>
              <input
                type="text"
                value={usernameOrEmail}
                onChange={e => setUsernameOrEmail(e.target.value)}
                placeholder="nama@email.com atau username"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 pr-12 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" />
                Ingat saya
              </label>
              <a href="#" className="text-sm text-primary hover:underline font-semibold">Lupa password?</a>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 rounded-full gradient-primary text-white font-semibold text-sm hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {status === 'loading' ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {status === 'loading' ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-on-surface-variant">
              Belum punya akun?{' '}
              <Link href="/register" className="text-primary font-semibold hover:underline">Daftar</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          © 2026 DAYA MART. All rights reserved.
        </p>
      </div>
    </div>
  );
}
