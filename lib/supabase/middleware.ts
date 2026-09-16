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

  // Pending page
  if (pathname.startsWith('/pending')) return true;

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

  // 3. Cek status user (pending/rejected) — blokir akses kecuali owner
  if (user && !isPublic && !pathname.startsWith('/pending') && !pathname.startsWith('/api/')) {
    const role = user.user_metadata?.role;

    // Owner selalu bisa akses
    if (role !== 'owner') {
      let userStatus: string | undefined;
      let profileFetchOk = false;

      // Direct fetch ke Supabase REST API dengan service role key (bypass RLS, reliable di Edge)
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey && supabaseUrl) {
        // Timeout 3 detik agar tidak hang di Edge Runtime
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
          const res = await fetch(
            `${supabaseUrl}/rest/v1/profiles?select=status,role&id=eq.${user.id}&limit=1`,
            {
              headers: {
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
                'Accept': 'application/json',
              },
              cache: 'no-store',
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const profiles = await res.json();
            const profile = profiles?.[0];
            if (profile) {
              profileFetchOk = true;
              // Owner di profiles juga bisa akses
              if (profile.role === 'owner') {
                return supabaseResponse;
              }
              userStatus = profile.status;
            }
          }
        } catch (e) {
          clearTimeout(timeoutId);
          // Fail-open: jika fetch timeout/error, izinkan akses (jangan blokir user)
          console.error('[middleware] profile fetch error (fail-open):', e);
          return supabaseResponse;
        }
      }

      // Hanya blokir jika profile fetch berhasil dan status bukan active/approved
      if (profileFetchOk && userStatus) {
        if (userStatus !== 'active' && userStatus !== 'approved') {
          const url = request.nextUrl.clone();
          url.pathname = '/pending';
          return NextResponse.redirect(url);
        }
      }
    }
  }

  // 4. Proteksi panel owner — harus login
  if (pathname.startsWith('/panel') && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
