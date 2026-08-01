'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, User, Receipt, Settings, LayoutDashboard, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UserSession {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  role: 'user' | 'owner';
}

export default function TopBar() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, email, avatar_url, role, status')
            .eq('id', authUser.id)
            .single();

          if (profile) {
            setUser({
              id: authUser.id,
              username: profile.username || authUser.email?.split('@')[0] || 'User',
              email: profile.email || authUser.email || '',
              avatar_url: profile.avatar_url,
              role: profile.role,
            });
          } else {
            // Profile not yet created by trigger — use auth data
            setUser({
              id: authUser.id,
              username: authUser.email?.split('@')[0] || 'User',
              email: authUser.email || '',
              avatar_url: null,
              role: 'user',
            });
          }
        }
      } catch {
        // Supabase not configured yet — silently fail
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setDropdownOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md shadow-sm border-b border-outline-variant flex items-center justify-between px-6 lg:px-10 py-3">
      {/* Search Bar */}
      <div className="flex-1 max-w-md relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-on-surface-variant group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Cari game atau produk..."
          className="block w-full pl-10 pr-4 py-2 border border-outline-variant rounded-full leading-5 bg-surface-container-lowest placeholder-on-surface-variant text-sm
          focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-[0_0_10px_rgba(192,0,58,0.2)] transition-all duration-300"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-colors duration-200 relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
        </button>

        {/* Not logged in */}
        {!loading && !user && (
          <Link href="/login"
            className="px-4 py-2 rounded-full gradient-primary text-white font-semibold text-xs hover:opacity-90 transition-all shadow-sm">
            Masuk
          </Link>
        )}

        {/* Logged in — Avatar + Dropdown */}
        {!loading && user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-0.5 rounded-full hover:ring-2 hover:ring-primary/30 transition-all duration-200"
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-[0px_8px_30px_rgba(0,0,0,0.12)] overflow-hidden animate-fade-in z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-outline-variant/30 flex items-center gap-3">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{user.username}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                  </div>
                </div>

                {/* Links */}
                <div className="py-1">
                  <Link href="/profil" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors">
                    <User size={16} className="text-on-surface-variant" /> Profil Saya
                  </Link>
                  <Link href="/profil#riwayat" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors">
                    <Receipt size={16} className="text-on-surface-variant" /> Riwayat Transaksi
                  </Link>
                  <Link href="/profil#pengaturan" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors">
                    <Settings size={16} className="text-on-surface-variant" /> Pengaturan
                  </Link>
                </div>

                {/* Owner Panel */}
                {user.role === 'owner' && (
                  <div className="border-t border-outline-variant/30 py-1">
                    <Link href="/panel/x7k9m2-daya-owner" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary font-semibold hover:bg-primary/5 transition-colors">
                      <LayoutDashboard size={16} /> Owner Panel
                    </Link>
                  </div>
                )}

                {/* Logout */}
                <div className="border-t border-outline-variant/30 py-1">
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors">
                    <LogOut size={16} /> Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="w-8 h-8 rounded-full bg-surface-container-high animate-pulse" />
        )}
      </div>
    </header>
  );
}
