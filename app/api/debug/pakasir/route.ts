import { createClient } from '@/lib/supabase/server';
import { getPakasir, getSettings } from '@/lib/server-config';
import { createPakasirQris } from '@/lib/pakasir';
import { NextResponse } from 'next/server';

/**
 * GET /api/debug/pakasir
 *
 * Endpoint diagnostik untuk debug koneksi Pakasir.
 * Hanya bisa diakses oleh owner.
 * Menampilkan: slug, apiKey (masked), test call result.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== 'owner') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const result: Record<string, any> = {};

  // 1. Cek credentials
  const pk = await getPakasir();
  result.slug = pk.slug || '(KOSONG!)';
  result.apiKey = pk.apiKey ? `${pk.apiKey.substring(0, 6)}...${pk.apiKey.slice(-4)}` : '(KOSONG!)';
  result.slugPresent = !!pk.slug;
  result.apiKeyPresent = !!pk.apiKey;

  // 2. Cek test_mode setting
  const settings = await getSettings(['test_mode']);
  result.testMode = settings.test_mode || 'not set';

  // 3. Cek env vars
  result.envPakasirSlug = process.env.PAKASIR_SLUG ? 'SET' : 'NOT SET';
  result.envPakasirApiKey = process.env.PAKASIR_API_KEY ? 'SET' : 'NOT SET';

  // 4. Test create QRIS (v2 → v1 fallback), amount Rp 1000
  if (pk.slug && pk.apiKey) {
    const r = await createPakasirQris(pk, `TEST-${Date.now()}`, 1000);
    result.qrStringReceived = r.ok;
    result.apiVersion = r.version;
    result.txnId = r.txnId;
    result.isSandbox = r.isSandbox;
    result.qrStringLength = r.qrString?.length ?? 0;
    result.error = r.error ?? null;
    result.raw = r.raw ?? null;
  } else {
    result.skippedTest = true;
    result.hint = 'Slug atau API key kosong. Set di Panel Owner → API atau Pengaturan.';
  }

  return NextResponse.json(result);
}
