import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route publik — tidak perlu login untuk mengakses.
 * '/' BUKAN publik — harus login dulu. Awal masuk web = /login.
 */
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/bantuan',
];

function isPublicRoute(pathname: string) {
  // Auth pages
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) return true;

  // API routes & webhooks
  if (pathname.startsWith('/api/')) return true;

  // Bantuan bisa diakses tanpa login
  if (pathname.startsWith('/bantuan')) return true;

  return false;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Guard: skip jika env vars belum dikonfigurasi
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[middleware] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — skipping session refresh');
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // PENTING: getUser() sekaligus me-refresh token yang kedaluwarsa
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic = isPublicRoute(pathname);
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // 1. Belum login + akses halaman proteksi → redirect ke login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Sudah login + masih di halaman login/register → ke beranda
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 3. Proteksi panel owner — hanya owner aktif yang boleh akses
  // 3. Proteksi panel owner — harus login (role check dipindah ke panel layout)
  if (pathname.startsWith('/panel') && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
