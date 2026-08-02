'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, UserPlus, CheckCircle2, XCircle, Clock, UserCheck, UserX, Trash2, Loader2 } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  user_id?: string;
  username?: string;
  email?: string;
  is_read: boolean;
  created_at: string;
}

export default function OwnerNotifikasiPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const supabase = createClient();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    setNotifications(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleUserAction = async (notif: Notification, action: 'approved' | 'rejected') => {
    if (!notif.user_id) return;
    setActionLoading(`${notif.id}_${action}`);

    try {
      // Update status di profiles via API
      const res = await fetch('/api/owner/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: notif.user_id, action }),
      });

      if (res.ok) {
        await markAsRead(notif.id);
        // Reload untuk update status
        await loadNotifications();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const getUserStatus = async (userId?: string): Promise<string | null> => {
    if (!userId) return null;
    const { data } = await supabase.from('profiles').select('status').eq('id', userId).single();
    return data?.status || null;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
            <Bell size={28} className="text-primary" />
            Notifikasi
            {unreadCount > 0 && (
              <span className="bg-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{unreadCount}</span>
            )}
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">Notifikasi registrasi akun dan aktivitas penting.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 rounded-full border border-outline-variant text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-12 text-center shadow-soft">
            <Bell size={48} className="mx-auto text-outline-variant mb-4" />
            <p className="text-on-surface-variant font-medium">Belum ada notifikasi</p>
            <p className="text-xs text-on-surface-variant mt-1">Notifikasi dari registrasi user baru akan muncul di sini.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <NotifCard
              key={notif.id}
              notif={notif}
              actionLoading={actionLoading}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              onAction={handleUserAction}
              getUserStatus={getUserStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NotifCard({
  notif,
  actionLoading,
  onDelete,
  onAction,
  getUserStatus,
}: {
  notif: Notification;
  actionLoading: string | null;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onAction: (notif: Notification, action: 'approved' | 'rejected') => void;
  getUserStatus: (userId?: string) => Promise<string | null>;
}) {
  const [userStatus, setUserStatus] = useState<string | null>(null);

  useEffect(() => {
    if (notif.user_id) {
      getUserStatus(notif.user_id).then(setUserStatus);
    }
  }, [notif.user_id, getUserStatus]);

  const isActionTaken = userStatus === 'approved' || userStatus === 'rejected' || userStatus === 'active';

  return (
    <div
      className={cn(
        'bg-surface-container-lowest rounded-xl border p-5 shadow-soft transition-all hover:shadow-[0px_8px_30px_rgba(192,0,58,0.08)]',
        notif.is_read ? 'border-outline-variant/20' : 'border-primary/20 bg-primary/[0.02]'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          'p-2.5 rounded-xl shrink-0',
          notif.type === 'registration' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
        )}>
          <UserPlus size={20} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={cn('text-sm font-semibold text-on-surface', !notif.is_read && 'text-primary')}>
                {notif.title}
                {!notif.is_read && (
                  <span className="ml-2 w-2 h-2 bg-pink-500 rounded-full inline-block" />
                )}
              </h4>
              <p className="text-sm text-on-surface-variant mt-1">{notif.message}</p>
              <p className="text-xs text-on-surface-variant/70 mt-2">
                <Clock size={12} className="inline mr-1" />
                {formatDate(notif.created_at)}
              </p>
            </div>
            <button
              onClick={() => onDelete(notif.id)}
              className="p-1.5 rounded-full hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors shrink-0"
              title="Hapus notifikasi"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Action Buttons for Registration */}
          {notif.type === 'registration' && notif.user_id && (
            <div className="mt-3 pt-3 border-t border-outline-variant/30">
              {isActionTaken ? (
                <div className="flex items-center gap-2">
                  {userStatus === 'approved' || userStatus === 'active' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                      <CheckCircle2 size={14} /> Sudah Disetujui
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-semibold border border-red-200">
                      <XCircle size={14} /> Sudah Ditolak
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAction(notif, 'approved')}
                    disabled={actionLoading === `${notif.id}_approved`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === `${notif.id}_approved` ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                    Setujui Akun
                  </button>
                  <button
                    onClick={() => onAction(notif, 'rejected')}
                    disabled={actionLoading === `${notif.id}_rejected`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === `${notif.id}_rejected` ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                    Tolak Akun
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
