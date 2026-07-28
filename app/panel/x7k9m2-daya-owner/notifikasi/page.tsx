'use client';

import { useState, useEffect } from 'react';
import { Bell, UserPlus, CheckCircle2, XCircle, Clock, UserCheck, UserX, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  userId?: string;
  username?: string;
  email?: string;
  isRead: boolean;
  createdAt: string;
}

export default function OwnerNotifikasiPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const stored = JSON.parse(localStorage.getItem('daya_notifications') || '[]');
    setNotifications(stored);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    setNotifications(updated);
    localStorage.setItem('daya_notifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    localStorage.setItem('daya_notifications', JSON.stringify(updated));
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('daya_notifications', JSON.stringify(updated));
  };

  const handleUserAction = (notif: Notification, action: 'approved' | 'rejected') => {
    if (!notif.userId) return;

    // Update user status
    const users = JSON.parse(localStorage.getItem('daya_users') || '[]');
    const updatedUsers = users.map((u: { id: string; status: string }) =>
      u.id === notif.userId ? { ...u, status: action } : u
    );
    localStorage.setItem('daya_users', JSON.stringify(updatedUsers));

    // Mark notification as read
    markAsRead(notif.id);
  };

  const getUserStatus = (userId?: string): string | null => {
    if (!userId) return null;
    const users = JSON.parse(localStorage.getItem('daya_users') || '[]');
    const user = users.find((u: { id: string }) => u.id === userId);
    return user?.status || null;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
        {notifications.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-12 text-center shadow-soft">
            <Bell size={48} className="mx-auto text-outline-variant mb-4" />
            <p className="text-on-surface-variant font-medium">Belum ada notifikasi</p>
            <p className="text-xs text-on-surface-variant mt-1">Notifikasi dari registrasi user baru akan muncul di sini.</p>
          </div>
        ) : (
          notifications.map(notif => {
            const userStatus = getUserStatus(notif.userId);
            const isActionTaken = userStatus === 'approved' || userStatus === 'rejected';

            return (
              <div
                key={notif.id}
                className={cn(
                  'bg-surface-container-lowest rounded-xl border p-5 shadow-soft transition-all hover:shadow-[0px_8px_30px_rgba(192,0,58,0.08)]',
                  notif.isRead ? 'border-outline-variant/20' : 'border-primary/20 bg-primary/[0.02]'
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
                        <h4 className={cn('text-sm font-semibold text-on-surface', !notif.isRead && 'text-primary')}>
                          {notif.title}
                          {!notif.isRead && (
                            <span className="ml-2 w-2 h-2 bg-pink-500 rounded-full inline-block" />
                          )}
                        </h4>
                        <p className="text-sm text-on-surface-variant mt-1">{notif.message}</p>
                        <p className="text-xs text-on-surface-variant/70 mt-2">
                          <Clock size={12} className="inline mr-1" />
                          {formatDate(notif.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="p-1.5 rounded-full hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors shrink-0"
                        title="Hapus notifikasi"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Action Buttons for Registration */}
                    {notif.type === 'registration' && notif.userId && (
                      <div className="mt-3 pt-3 border-t border-outline-variant/30">
                        {isActionTaken ? (
                          <div className="flex items-center gap-2">
                            {userStatus === 'approved' ? (
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
                              onClick={() => handleUserAction(notif, 'approved')}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold hover:bg-green-100 transition-colors"
                            >
                              <UserCheck size={14} /> Setujui Akun
                            </button>
                            <button
                              onClick={() => handleUserAction(notif, 'rejected')}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors"
                            >
                              <UserX size={14} /> Tolak Akun
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
