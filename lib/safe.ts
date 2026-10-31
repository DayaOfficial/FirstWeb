/**
 * Safe database helper — wraps Supabase operations to ensure errors
 * are ALWAYS visible (never silently swallowed).
 *
 * Usage:
 *   const data = await db(supabase.from('settings').upsert(rows))
 *   if (data !== undefined) { // success }
 */

export async function db<T>(
  p: Promise<{ data?: T | null; error: any }>
): Promise<T | undefined> {
  const { data, error } = await p;
  if (error) {
    console.error('[DB ERROR]', error.message ?? error);
    if (typeof window !== 'undefined') {
      alert('Gagal: ' + (error.message ?? 'Kesalahan database'));
    }
    return undefined;
  }
  return (data ?? undefined) as T | undefined;
}

/**
 * Safe fetch helper — wraps fetch calls with error handling.
 * Returns parsed JSON or undefined on failure.
 */
export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<T | undefined> {
  try {
    const res = await fetch(url, options);
    const json = await res.json();
    if (!res.ok) {
      const msg = json?.error || `HTTP ${res.status}`;
      console.error('[FETCH ERROR]', msg);
      if (typeof window !== 'undefined') {
        alert('Gagal: ' + msg);
      }
      return undefined;
    }
    return json as T;
  } catch (err: any) {
    console.error('[FETCH ERROR]', err?.message ?? err);
    if (typeof window !== 'undefined') {
      alert('Gagal: Kesalahan jaringan');
    }
    return undefined;
  }
}
