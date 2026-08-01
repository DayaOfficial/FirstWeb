'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight, User, LayoutDashboard, KeyRound, LogOut,
  Search, Filter, Camera, Trash2, Package, Loader2
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

      {/* Profile Card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-soft overflow-hidden">
        <div className="gradient-primary h-24 relative" />
        <div className="px-6 pb-6 -mt-12 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative group">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-surface-container-lowest object-cover shadow-soft" />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-surface-container-lowest bg-surface-container-high flex items-center justify-center shadow-soft">
                  <span className="text-2xl font-bold text-on-surface-variant/60">{profile.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">{profile.username}</h2>
              <p className="text-sm text-on-surface-variant">{profile.email}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {profile.avatar_url && (
                <button onClick={handleRemoveAvatar} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-error hover:bg-error/5 transition-colors flex items-center gap-1">
                  <Trash2 size={12} /> Hapus Foto
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-on-surface-variant">Username</p>
              <p className="text-sm font-semibold text-on-surface">{profile.username}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Email</p>
              <p className="text-sm font-semibold text-on-surface">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Member Sejak</p>
              <p className="text-sm font-semibold text-on-surface">{new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Status</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${profile.status === 'approved' ? 'bg-accent-green/10 text-accent-green border border-accent-green/30' : 'bg-amber-100 text-amber-700 border border-amber-300'}`}>
                {profile.status === 'approved' ? 'Aktif' : profile.status === 'pending' ? 'Menunggu' : profile.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Panel Button */}
      {isOwner && (
        <Link href="/panel/x7k9m2-daya-owner"
          className="block bg-gradient-to-r from-primary via-primary-container to-pink-500 rounded-xl p-5 text-white shadow-soft hover:opacity-95 transition-opacity group">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-lg backdrop-blur-sm">
              <LayoutDashboard size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm font-[family-name:var(--font-heading)]">Masuk Owner Control Panel</h3>
              <p className="text-xs text-white/70">Kelola produk, pesanan, dan pengaturan toko</p>
            </div>
            <ChevronRight size={20} className="text-white/60 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      )}

      {/* Riwayat Transaksi */}
      <section className="space-y-4">
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

      {/* Pengaturan Akun */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">Pengaturan Akun</h2>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-soft overflow-hidden divide-y divide-outline-variant/30">
          <button className="w-full px-5 py-4 flex items-center gap-3 hover:bg-surface-container-low transition-colors group">
            <KeyRound size={20} className="text-on-surface-variant group-hover:text-primary transition-colors" />
            <span className="flex-1 text-sm font-semibold text-on-surface text-left">Ubah Password</span>
            <ChevronRight size={16} className="text-on-surface-variant" />
          </button>
          <button onClick={handleLogout} className="w-full px-5 py-4 flex items-center gap-3 hover:bg-error/5 transition-colors group">
            <LogOut size={20} className="text-on-surface-variant group-hover:text-error transition-colors" />
            <span className="flex-1 text-sm font-semibold text-on-surface text-left group-hover:text-error transition-colors">Keluar</span>
            <ChevronRight size={16} className="text-on-surface-variant" />
          </button>
        </div>
      </section>
    </div>
  );
}
