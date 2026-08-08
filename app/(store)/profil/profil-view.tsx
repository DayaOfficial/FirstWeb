'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight, User, LayoutDashboard, KeyRound, LogOut,
  Search, Filter, Camera, Trash2, Package, Loader2,
  Eye, EyeOff, X, CheckCircle2, AlertCircle, ShieldCheck
} from 'lucide-react';
import { formatRupiah, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  role: 'user' | 'owner';
  status: string;
  created_at: string;
}

interface OrderRow {
  id: string;
  order_code: string;
  product_name: string;
  module: string;
  amount: number;
  payment_status: string;
  process_status: string;
  created_at: string;
}

const MODULES = [
  { value: '', label: 'Semua' },
  { value: 'digiflazz', label: 'Topup Game / Pulsa / Token' },
  { value: 'jokerpanel', label: 'SMM Panel' },
  { value: 'manual_nokos', label: 'Nokos' },
  { value: 'manual_app', label: 'App Premium' },
  { value: 'manual_robux', label: 'Robux Vilog' },
];

function getStatusStyle(status: string) {
  const styles: Record<string, string> = {
    success: 'bg-accent-green/10 text-accent-green border-accent-green/30',
    sukses: 'bg-accent-green/10 text-accent-green border-accent-green/30',
    paid: 'bg-accent-green/10 text-accent-green border-accent-green/30',
    processing: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    pending: 'bg-accent-blue/10 text-accent-blue border-accent-blue/30',
    waiting: 'bg-gray-100 text-gray-500 border-gray-300',
    failed: 'bg-error/10 text-error border-error/30',
    expired: 'bg-gray-100 text-gray-500 border-gray-300',
    canceled: 'bg-gray-100 text-gray-500 border-gray-300',
    refunded: 'bg-amber-100 text-amber-700 border-amber-300',
    partial: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  };
  return styles[status] || 'bg-gray-100 text-gray-500 border-gray-300';
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    success: 'Sukses', sukses: 'Sukses', paid: 'Dibayar',
    processing: 'Diproses', pending: 'Pending',
    waiting: 'Menunggu', failed: 'Gagal',
    expired: 'Kedaluwarsa', canceled: 'Dibatalkan',
    refunded: 'Refund', partial: 'Sebagian',
  };
  return labels[status] || status;
}

interface ProfilViewProps {
  profile: Profile;
  orders: OrderRow[];
  isOwner: boolean;
}

export default function ProfilView({ profile: initialProfile, orders: initialOrders, isOwner }: ProfilViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [orders] = useState<OrderRow[]>(initialOrders);
  const [filterModule, setFilterModule] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCount, setShowCount] = useState(10);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwShowCurrent, setPwShowCurrent] = useState(false);
  const [pwShowNew, setPwShowNew] = useState(false);
  const [pwShowConfirm, setPwShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const resetPasswordForm = () => {
    setPwCurrent(''); setPwNew(''); setPwConfirm('');
    setPwShowCurrent(false); setPwShowNew(false); setPwShowConfirm(false);
    setPwError(''); setPwSuccess(false); setPwLoading(false);
  };

  const openPasswordModal = () => { resetPasswordForm(); setShowPasswordModal(true); };
  const closePasswordModal = () => { setShowPasswordModal(false); resetPasswordForm(); };

  // Client-side validation
  const pwNewValid = pwNew.length >= 8 && /[A-Z]/.test(pwNew) && /[0-9]/.test(pwNew);
  const pwConfirmMatch = pwNew === pwConfirm && pwConfirm.length > 0;
  const pwSameAsOld = pwCurrent.length > 0 && pwNew === pwCurrent;
  const pwFormValid = pwCurrent.length > 0 && pwNewValid && pwConfirmMatch && !pwSameAsOld;

  const handleChangePassword = async () => {
    if (!pwFormValid) return;
    setPwLoading(true); setPwError('');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwSuccess(true);
        setTimeout(() => closePasswordModal(), 2000);
      } else {
        setPwError(data.error || 'Gagal mengubah password.');
      }
    } catch {
      setPwError('Terjadi kesalahan jaringan. Coba lagi.');
    }
    setPwLoading(false);
  };

  // Auto-scroll ke section berdasarkan hash (#riwayat, #pengaturan)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 2 * 1024 * 1024) { alert('Ukuran file maksimal 2MB'); return; }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const filePath = `${profile.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch {
      alert('Gagal upload avatar. Pastikan bucket "avatars" sudah dibuat di Supabase Storage.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile) return;
    try {
      const supabase = createClient();
      await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      setProfile(prev => ({ ...prev, avatar_url: null }));
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    router.push('/');
    router.refresh();
  };

  // Filter & search
  const filteredOrders = orders
    .filter(o => !filterModule || o.module === filterModule)
    .filter(o => !searchQuery.trim() || o.order_code.toLowerCase().includes(searchQuery.toLowerCase()) || (o.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const visibleOrders = filteredOrders.slice(0, showCount);
  const hasMore = filteredOrders.length > showCount;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">Profil Saya</span>
      </nav>

      <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
        <User size={28} /> Profil Saya
      </h1>

      {/* Profile Card — Redesigned */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-soft overflow-hidden">
        {/* Gradient Banner — taller */}
        <div className="gradient-primary h-28 relative" />

        {/* Content area — avatar overlapping gradient edge */}
        <div className="px-6 pb-6 relative">
          {/* Avatar — centered, overlaps gradient by ~60% */}
          <div className="flex justify-center sm:justify-start -mt-14 mb-4">
            <div className="relative group">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar"
                  className="w-24 h-24 rounded-full border-[5px] border-surface-container-lowest object-cover shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-full border-[5px] border-surface-container-lowest bg-surface-container-high flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-on-surface-variant/60">{profile.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 ring-2 ring-surface-container-lowest"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
            </div>
          </div>

          {/* Name & Email — fully in white area, centered on mobile */}
          <div className="text-center sm:text-left mb-6">
            <h2 className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)]">{profile.username}</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">{profile.email}</p>
          </div>

          {/* Info Grid — 4 columns, separated by border */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 rounded-xl border border-outline-variant/30 overflow-hidden mb-6">
            <div className="p-4 text-center border-r border-b sm:border-b-0 border-outline-variant/30">
              <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Member Sejak</p>
              <p className="text-sm font-bold text-on-surface">{new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="p-4 text-center border-b sm:border-b-0 sm:border-r border-outline-variant/30">
              <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${(profile.status === 'approved' || profile.status === 'active') ? 'bg-accent-green/10 text-accent-green border border-accent-green/30' : 'bg-amber-100 text-amber-700 border border-amber-300'}`}>
                {(profile.status === 'approved' || profile.status === 'active') ? '● Aktif' : profile.status === 'pending' ? '● Menunggu' : (profile.status || '● Aktif')}
              </span>
            </div>
            <div className="p-4 text-center border-r border-outline-variant/30">
              <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Total Transaksi</p>
              <p className="text-sm font-bold text-on-surface">{orders.length}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Total Belanja</p>
              <p className="text-sm font-bold text-primary">{formatRupiah(orders.reduce((sum, o) => sum + (o.amount || 0), 0))}</p>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap gap-2">
            {profile.avatar_url && (
              <button onClick={handleRemoveAvatar}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant bg-surface-container-high hover:bg-surface-container border border-outline-variant/30 transition-colors">
                <Trash2 size={14} /> Hapus Foto
              </button>
            )}
            <button onClick={openPasswordModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant bg-surface-container-high hover:bg-surface-container border border-outline-variant/30 transition-colors">
              <KeyRound size={14} /> Ganti Password
            </button>
            {isOwner && (
              <Link href="/panel/x7k9m2-daya-owner"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white gradient-primary shadow-sm hover:opacity-90 transition-opacity">
                <LayoutDashboard size={14} /> Panel Owner
              </Link>
            )}
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-error bg-error/5 hover:bg-error/10 border border-error/20 transition-colors ml-auto">
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </div>

      {/* Riwayat Transaksi */}
      <section id="riwayat" className="space-y-4 scroll-mt-20">
        <h2 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">Riwayat Transaksi</h2>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-on-surface-variant" />
            </div>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari kode pesanan..."
              className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-xl bg-surface-container-lowest text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <select value={filterModule} onChange={e => setFilterModule(e.target.value)}
              className="pl-9 pr-8 py-2.5 border border-outline-variant rounded-xl bg-surface-container-lowest text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer min-w-[160px]">
              {MODULES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>

        {/* Order List */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-soft overflow-hidden divide-y divide-outline-variant/30">
          {visibleOrders.map(order => (
            <div key={order.id} className="p-4 hover:bg-surface-container-low transition-colors flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-on-surface-variant font-mono">{order.order_code}</p>
                <p className="text-sm font-semibold text-on-surface truncate">{order.product_name || 'Produk'}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{formatDate(order.created_at)}</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <p className="text-sm font-bold text-on-surface font-[family-name:var(--font-heading)]">{formatRupiah(order.amount)}</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusStyle(order.process_status)}`}>
                  {getStatusLabel(order.process_status)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {visibleOrders.length === 0 && (
          <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
            <Package size={48} className="mx-auto mb-4 text-on-surface-variant/30" />
            <p className="text-sm text-on-surface-variant font-semibold">Belum ada transaksi.</p>
            <p className="text-xs text-on-surface-variant mt-1">Yuk mulai belanja!</p>
          </div>
        )}

        {hasMore && (
          <button onClick={() => setShowCount(prev => prev + 10)}
            className="w-full py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-sm font-semibold text-primary hover:bg-primary/5 transition-colors">
            Muat Lebih Banyak
          </button>
        )}
      </section>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={closePasswordModal}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-primary" />
                <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">Ubah Password</h3>
              </div>
              <button onClick={closePasswordModal} className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"><X size={18} /></button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Success */}
              {pwSuccess && (
                <div className="flex items-center gap-3 p-4 bg-accent-green/10 border border-accent-green/30 rounded-xl animate-fade-in">
                  <CheckCircle2 size={20} className="text-accent-green shrink-0" />
                  <p className="text-sm font-semibold text-accent-green">Password berhasil diubah!</p>
                </div>
              )}

              {/* Error */}
              {pwError && (
                <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/30 rounded-xl animate-fade-in">
                  <AlertCircle size={20} className="text-error shrink-0" />
                  <p className="text-sm text-error">{pwError}</p>
                </div>
              )}

              {!pwSuccess && (
                <>
                  {/* Password Lama */}
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5">Password Lama</label>
                    <div className="relative">
                      <input type={pwShowCurrent ? 'text' : 'password'} value={pwCurrent} onChange={e => setPwCurrent(e.target.value)}
                        placeholder="Masukkan password lama"
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 pr-12 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                      <button type="button" onClick={() => setPwShowCurrent(!pwShowCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                        {pwShowCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Password Baru */}
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5">Password Baru</label>
                    <div className="relative">
                      <input type={pwShowNew ? 'text' : 'password'} value={pwNew} onChange={e => setPwNew(e.target.value)}
                        placeholder="Minimal 8 karakter, huruf besar & angka"
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 pr-12 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                      <button type="button" onClick={() => setPwShowNew(!pwShowNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                        {pwShowNew ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {pwNew.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className={`text-xs flex items-center gap-1 ${pwNew.length >= 8 ? 'text-accent-green' : 'text-on-surface-variant'}`}>
                          {pwNew.length >= 8 ? <CheckCircle2 size={12} /> : <span className="w-3 h-3 rounded-full border border-outline-variant inline-block" />} Minimal 8 karakter
                        </p>
                        <p className={`text-xs flex items-center gap-1 ${/[A-Z]/.test(pwNew) ? 'text-accent-green' : 'text-on-surface-variant'}`}>
                          {/[A-Z]/.test(pwNew) ? <CheckCircle2 size={12} /> : <span className="w-3 h-3 rounded-full border border-outline-variant inline-block" />} Mengandung huruf besar
                        </p>
                        <p className={`text-xs flex items-center gap-1 ${/[0-9]/.test(pwNew) ? 'text-accent-green' : 'text-on-surface-variant'}`}>
                          {/[0-9]/.test(pwNew) ? <CheckCircle2 size={12} /> : <span className="w-3 h-3 rounded-full border border-outline-variant inline-block" />} Mengandung angka
                        </p>
                      </div>
                    )}
                    {pwSameAsOld && <p className="text-xs text-error mt-1">Password baru harus berbeda dari yang lama.</p>}
                  </div>

                  {/* Konfirmasi */}
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5">Konfirmasi Password Baru</label>
                    <div className="relative">
                      <input type={pwShowConfirm ? 'text' : 'password'} value={pwConfirm} onChange={e => setPwConfirm(e.target.value)}
                        placeholder="Ketik ulang password baru"
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 pr-12 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                      <button type="button" onClick={() => setPwShowConfirm(!pwShowConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                        {pwShowConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {pwConfirm.length > 0 && !pwConfirmMatch && <p className="text-xs text-error mt-1">Konfirmasi password tidak sama.</p>}
                  </div>

                  {/* Submit */}
                  <button onClick={handleChangePassword} disabled={!pwFormValid || pwLoading}
                    className="w-full py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {pwLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                    {pwLoading ? 'Memproses...' : 'Simpan Password'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
