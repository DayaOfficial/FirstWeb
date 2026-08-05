'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, CheckCircle2, XCircle, Clock, Search, UserCheck, UserX,
  Loader2, Ban, Trash2, ShieldOff, AlertTriangle, X
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';

interface UserData {
  id: string;
  username: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  role: string;
  created_at: string;
}

export default function OwnerUserPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected' | 'blocked'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'block' | 'unblock' | 'delete';
    user: UserData;
  } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/owner/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('[users] load error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const updateUserStatus = async (userId: string, action: 'approved' | 'rejected' | 'blocked' | 'unblocked') => {
    setActionLoading(`${userId}_${action}`);
    try {
      const res = await fetch('/api/owner/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) {
        const statusMap: Record<string, string> = {
          approved: 'approved', rejected: 'rejected',
          blocked: 'blocked', unblocked: 'approved',
        };
        setUsers(prev =>
          prev.map(u => u.id === userId ? { ...u, status: statusMap[action] as UserData['status'] } : u)
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Gagal. Coba lagi.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan.');
    }
    setActionLoading(null);
    setConfirmDialog(null);
  };

  const deleteUser = async (userId: string, username: string) => {
    setActionLoading(`${userId}_delete`);
    try {
      const res = await fetch('/api/owner/user-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, confirmUsername: username }),
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Gagal menghapus. Coba lagi.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan.');
    }
    setActionLoading(null);
    setConfirmDialog(null);
    setDeleteConfirmText('');
  };

  const filtered = users.filter(u => {
    const matchFilter = filter === 'all' || u.status === filter ||
      (filter === 'active' && (u.status === 'approved'));
    const matchSearch = (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const approvedCount = users.filter(u => u.status === 'approved').length;
  const blockedCount = users.filter(u => u.status === 'blocked').length;
  const rejectedCount = users.filter(u => u.status === 'rejected').length;

  const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    approved: { label: 'Aktif', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    blocked: { label: 'Diblokir', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Ban },
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
        <p className="text-sm text-on-surface-variant mt-1">Kelola akun pengguna, persetujuan, blokir, dan hapus.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Menunggu', count: pendingCount, icon: Clock, bg: 'bg-amber-100', color: 'text-amber-600' },
          { label: 'Aktif', count: approvedCount, icon: CheckCircle2, bg: 'bg-green-100', color: 'text-green-600' },
          { label: 'Diblokir', count: blockedCount, icon: Ban, bg: 'bg-orange-100', color: 'text-orange-600' },
          { label: 'Ditolak', count: rejectedCount, icon: XCircle, bg: 'bg-red-100', color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-surface-container-lowest rounded-xl p-5 shadow-soft border border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${s.bg} ${s.color} rounded-lg`}><s.icon size={20} /></div>
              <div>
                <p className="text-xs text-on-surface-variant">{s.label}</p>
                <p className="text-xl font-bold text-on-surface font-[family-name:var(--font-heading)]">{s.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {([['all', 'Semua'], ['pending', 'Pending'], ['active', 'Aktif'], ['blocked', 'Diblokir'], ['rejected', 'Ditolak']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={cn('px-4 py-2 rounded-full text-xs font-semibold transition-all',
                filter === key ? 'gradient-primary text-white shadow-md' : 'bg-surface-container-high border border-outline-variant text-on-surface hover:border-primary hover:text-primary'
              )}>
              {label}
              {key === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 bg-white/20 text-white px-1.5 py-0.5 rounded-full text-[10px]">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari user..."
            className="w-full sm:w-64 bg-surface-container-lowest border border-outline-variant rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
        </div>
      </div>

      {/* User Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-soft overflow-hidden border border-outline-variant/20">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-outline-variant mb-4" />
            <p className="text-on-surface-variant font-medium">Belum ada user terdaftar</p>
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
                          <StatusIcon size={12} />{sc.label}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-sm text-on-surface-variant">{formatDate(user.created_at)}</td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Pending → Setujui / Tolak */}
                          {user.status === 'pending' && (
                            <>
                              <button onClick={() => updateUserStatus(user.id, 'approved')} disabled={!!actionLoading}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold hover:bg-green-100 transition-colors disabled:opacity-50">
                                {actionLoading === `${user.id}_approved` ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />} Setujui
                              </button>
                              <button onClick={() => updateUserStatus(user.id, 'rejected')} disabled={!!actionLoading}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50">
                                {actionLoading === `${user.id}_rejected` ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />} Tolak
                              </button>
                            </>
                          )}

                          {/* Approved → Blokir / Hapus */}
                          {user.status === 'approved' && (
                            <>
                              <button onClick={() => setConfirmDialog({ type: 'block', user })}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-semibold hover:bg-orange-100 transition-colors">
                                <Ban size={14} /> Blokir
                              </button>
                              <button onClick={() => setConfirmDialog({ type: 'delete', user })}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors">
                                <Trash2 size={14} /> Hapus
                              </button>
                            </>
                          )}

                          {/* Blocked → Buka Blokir / Hapus */}
                          {user.status === 'blocked' && (
                            <>
                              <button onClick={() => setConfirmDialog({ type: 'unblock', user })}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold hover:bg-green-100 transition-colors">
                                <ShieldOff size={14} /> Buka Blokir
                              </button>
                              <button onClick={() => setConfirmDialog({ type: 'delete', user })}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors">
                                <Trash2 size={14} /> Hapus
                              </button>
                            </>
                          )}

                          {/* Rejected → Hapus */}
                          {user.status === 'rejected' && (
                            <button onClick={() => setConfirmDialog({ type: 'delete', user })}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors">
                              <Trash2 size={14} /> Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => { setConfirmDialog(null); setDeleteConfirmText(''); }}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={cn('flex items-center justify-between p-5 border-b border-outline-variant/30',
              confirmDialog.type === 'delete' ? 'bg-red-50' : confirmDialog.type === 'block' ? 'bg-orange-50' : 'bg-green-50'
            )}>
              <div className="flex items-center gap-2">
                {confirmDialog.type === 'delete' ? <AlertTriangle size={20} className="text-error" /> :
                 confirmDialog.type === 'block' ? <Ban size={20} className="text-orange-600" /> :
                 <ShieldOff size={20} className="text-green-600" />}
                <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">
                  {confirmDialog.type === 'delete' ? 'Hapus User Permanen' :
                   confirmDialog.type === 'block' ? 'Blokir User' : 'Buka Blokir User'}
                </h3>
              </div>
              <button onClick={() => { setConfirmDialog(null); setDeleteConfirmText(''); }} className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant"><X size={18} /></button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {confirmDialog.type === 'delete' ? (
                <>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-800 font-semibold">⚠️ Tindakan ini permanen dan tidak bisa dibatalkan.</p>
                    <ul className="mt-2 text-xs text-red-700 space-y-1">
                      <li>• User tidak bisa login selamanya</li>
                      <li>• Data profil dihapus</li>
                      <li>• Riwayat transaksi tetap ada (untuk audit)</li>
                    </ul>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5">
                      Ketik <span className="text-error font-bold">{confirmDialog.user.username}</span> untuk mengonfirmasi:
                    </label>
                    <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder={confirmDialog.user.username}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-error focus:ring-1 focus:ring-error transition-all" />
                  </div>
                  <button onClick={() => deleteUser(confirmDialog.user.id, confirmDialog.user.username)}
                    disabled={deleteConfirmText !== confirmDialog.user.username || !!actionLoading}
                    className="w-full py-3 rounded-full bg-error text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                    {actionLoading === `${confirmDialog.user.id}_delete` ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    Hapus Permanen
                  </button>
                </>
              ) : confirmDialog.type === 'block' ? (
                <>
                  <p className="text-sm text-on-surface">
                    Blokir user <strong>{confirmDialog.user.username}</strong>? Mereka tidak bisa login sampai diaktifkan kembali. Data dan riwayat tetap tersimpan.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmDialog(null)}
                      className="flex-1 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors">
                      Batal
                    </button>
                    <button onClick={() => updateUserStatus(confirmDialog.user.id, 'blocked')} disabled={!!actionLoading}
                      className="flex-1 py-2.5 rounded-full bg-orange-500 text-white text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {actionLoading === `${confirmDialog.user.id}_blocked` ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                      Ya, Blokir
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-on-surface">
                    Buka blokir user <strong>{confirmDialog.user.username}</strong>? Mereka akan bisa login kembali.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmDialog(null)}
                      className="flex-1 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors">
                      Batal
                    </button>
                    <button onClick={() => updateUserStatus(confirmDialog.user.id, 'unblocked')} disabled={!!actionLoading}
                      className="flex-1 py-2.5 rounded-full bg-green-600 text-white text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {actionLoading === `${confirmDialog.user.id}_unblocked` ? <Loader2 size={16} className="animate-spin" /> : <ShieldOff size={16} />}
                      Ya, Buka Blokir
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
