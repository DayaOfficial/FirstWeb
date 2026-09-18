import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Routes that need ZERO Supabase calls — return immediately.
 * API routes handle their own auth internally.
 */
function isSkipRoute(pathname: string) {
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/bantuan')) return true;
  if (pathname.startsWith('/pending')) return true;
  return false;
}

function isAuthPage(pathname: string) {
  return pathname.startsWith('/login') || pathname.startsWith('/register');
}

/**
 * The actual session/auth logic, separated so we can wrap it with a timeout.
 */
async function doUpdateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
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

  // getUser() me-refresh token — ini satu-satunya network call yang wajib
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Belum login + akses halaman proteksi → redirect ke login
  if (!user && !isAuthPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Sudah login + masih di halaman login/register → ke beranda
  if (user && isAuthPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 3. Cek status user (pending/rejected) — blokir akses kecuali owner
  if (user && !pathname.startsWith('/pending')) {
    const role = user.user_metadata?.role;

    // Owner selalu bisa akses
    if (role !== 'owner') {
      // Cek status dari user_metadata dulu (no network call)
      const metaStatus = user.user_metadata?.status as string | undefined;
      if (metaStatus && metaStatus !== 'active' && metaStatus !== 'approved') {
        const url = request.nextUrl.clone();
        url.pathname = '/pending';
        return NextResponse.redirect(url);
      }

      // Fallback: fetch profile hanya jika metadata tidak punya status
      if (!metaStatus) {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (serviceKey && supabaseUrl) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

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
                if (profile.role === 'owner') {
                  return supabaseResponse;
                }
                if (profile.status && profile.status !== 'active' && profile.status !== 'approved') {
                  const url = request.nextUrl.clone();
                  url.pathname = '/pending';
                  return NextResponse.redirect(url);
                }
              }
            }
          } catch {
            // Fail-open: timeout/error → izinkan akses
            clearTimeout(timeoutId);
          }
        }
      }
    }
  }

  return supabaseResponse;
}

/**
 * Main entry — wraps doUpdateSession with a hard timeout.
 * If ANYTHING takes too long, we fail-open (allow access) instead of 504.
 */
export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Fast-path: skip ALL Supabase calls for routes that don't need auth
  if (isSkipRoute(pathname)) {
    return NextResponse.next({ request });
  }

  // Wrap entire auth flow with a hard timeout (4 seconds)
  // Vercel Hobby = 1.5s, Pro = 30s — 4s is safe for Pro; for Hobby we'd need <1s.
  try {
    const result = await Promise.race([
      doUpdateSession(request),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('middleware_timeout')), 4000)
      ),
    ]);
    return result;
  } catch (e) {
    console.error('[middleware] Global timeout — fail-open:', e);
    return NextResponse.next({ request });
  }
}
