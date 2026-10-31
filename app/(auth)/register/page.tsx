'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setErrorMsg('');

    // Client-side validation
    if (!username.trim() || !email.trim() || !password.trim()) {
      setStatus('error');
      setErrorMsg('Semua field wajib diisi.');
      return;
    }

    if (username.trim().length < 3) {
      setStatus('error');
      setErrorMsg('Username minimal 3 karakter.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setStatus('error');
      setErrorMsg('Username hanya boleh huruf, angka, dan underscore.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setErrorMsg('Format email tidak valid.');
      return;
    }

    if (password.length < 8) {
      setStatus('error');
      setErrorMsg('Password minimal 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setErrorMsg('Konfirmasi password tidak cocok.');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Gagal mendaftar. Coba lagi nanti.');
        return;
      }

      setStatus('success');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setStatus('error');
      setErrorMsg('Terjadi kesalahan jaringan. Pastikan koneksi internet stabil.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo size={48} />
          </Link>
          <h1 className="text-2xl font-bold text-primary mt-4 font-[family-name:var(--font-heading)]">Daftar Akun Baru</h1>
          <p className="text-sm text-on-surface-variant mt-1">Buat akun untuk mulai bertransaksi</p>
        </div>

        {/* Success Message */}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-fade-in">
            <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Registrasi Berhasil!</p>
              <p className="text-xs text-green-700 mt-1">Akun Anda berhasil didaftarkan. Silakan tunggu persetujuan dari owner sebelum bisa login.</p>
            </div>
          </div>
        )}

        {/* Error Message */}
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
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              <p className="text-xs text-on-surface-variant mt-1">Hanya huruf, angka, dan underscore</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@email.com"
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
                  placeholder="Minimal 8 karakter"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 pr-12 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 pr-12 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 rounded-full gradient-primary text-white font-semibold text-sm hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {status === 'loading' ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus size={18} />
              )}
              {status === 'loading' ? 'Mendaftar...' : 'Daftar Akun'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-on-surface-variant">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">Masuk</Link>
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
