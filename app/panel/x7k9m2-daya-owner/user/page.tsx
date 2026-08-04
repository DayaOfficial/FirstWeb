'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle2, XCircle, Clock, Search, UserCheck, UserX, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface UserData {
  id: string;
  username: string;
  email: string;
  status: 'pending' | 'active' | 'approved' | 'rejected';
  role: string;
  created_at: string;
}

export default function OwnerUserPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/owner/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        console.error('[users] failed to load:', await res.text());
      }
    } catch (err) {
      console.error('[users] load error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateUserStatus = async (userId: string, newStatus: 'approved' | 'rejected') => {
    setActionLoading(`${userId}_${newStatus}`);
    try {
      const res = await fetch('/api/owner/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: newStatus }),
      });

      if (res.ok) {
        // Update local state langsung
        const resultStatus = newStatus === 'approved' ? 'approved' : 'rejected';
        setUsers(prev =>
          prev.map(u => u.id === userId ? { ...u, status: resultStatus as UserData['status'] } : u)
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Gagal ${newStatus === 'approved' ? 'menyetujui' : 'menolak'} user. ${errData.error || 'Coba lagi.'}`);
      }
    } catch (err) {
      console.error('[users] action error:', err);
      alert('Terjadi kesalahan jaringan. Coba lagi.');
    }
    setActionLoading(null);
  };

  const filtered = users.filter(u => {
    const matchFilter = filter === 'all' || u.status === filter ||
      (filter === 'active' && (u.status === 'active' || u.status === 'approved'));
    const matchSearch = (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const approvedCount = users.filter(u => u.status === 'active' || u.status === 'approved').length;
  const rejectedCount = users.filter(u => u.status === 'rejected').length;

  const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    active: { label: 'Aktif', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    approved: { label: 'Disetujui', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
          <Users size={28} className="text-primary" />
          Manajemen User
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">Kelola akun pengguna dan persetujuan registrasi.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-soft border border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Clock size={20} /></div>
            <div>
              <p className="text-xs text-on-surface-variant">Menunggu Approval</p>
              <p className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)]">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-soft border border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><CheckCircle2 size={20} /></div>
            <div>
              <p className="text-xs text-on-surface-variant">Aktif</p>
              <p className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)]">{approvedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-soft border border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg"><XCircle size={20} /></div>
            <div>
              <p className="text-xs text-on-surface-variant">Ditolak</p>
              <p className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)]">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {([['all', 'Semua'], ['pending', 'Pending'], ['active', 'Aktif'], ['rejected', 'Ditolak']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-semibold transition-all',
                filter === key
                  ? 'gradient-primary text-white shadow-md'
                  : 'bg-surface-container-high border border-outline-variant text-on-surface hover:border-primary hover:text-primary'
              )}
            >
              {label}
              {key === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 bg-white/20 text-white px-1.5 py-0.5 rounded-full text-[10px]">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari user..."
            className="w-full sm:w-64 bg-surface-container-lowest border border-outline-variant rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* User Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-soft overflow-hidden border border-outline-variant/20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-outline-variant mb-4" />
            <p className="text-on-surface-variant font-medium">Belum ada user terdaftar</p>
            <p className="text-xs text-on-surface-variant mt-1">User yang mendaftar akan muncul di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-surface-container/50 border-b border-outline-variant">
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">User</th>
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Email</th>
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tanggal Daftar</th>
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {filtered.map(user => {
                  const sc = statusConfig[user.status] || statusConfig.pending;
                  const StatusIcon = sc.icon;
                  return (
                    <tr key={user.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-primary text-white flex items-center justify-center text-xs font-bold">
                            {(user.username || '??').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-on-surface">{user.username || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-sm text-on-surface-variant">{user.email || '-'}</td>
                      <td className="py-3 px-5">
                        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border', sc.color)}>
                          <StatusIcon size={12} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-sm text-on-surface-variant">{formatDate(user.created_at)}</td>
                      <td className="py-3 px-5 text-right">
                        {user.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => updateUserStatus(user.id, 'approved')}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === `${user.id}_approved` ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                              Setujui
                            </button>
                            <button
                              onClick={() => updateUserStatus(user.id, 'rejected')}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === `${user.id}_rejected` ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-on-surface-variant">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
