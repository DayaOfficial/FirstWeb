import { createClient } from '@/lib/supabase/server';
import { getPakasir, getSettings } from '@/lib/server-config';
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

  // 4. Test call ke Pakasir dengan amount kecil (Rp 1) — akan error tapi bisa lihat response format
  if (pk.slug && pk.apiKey) {
    try {
      const testBody = {
        project: pk.slug,
        order_id: `TEST-${Date.now()}`,
        amount: 1,
        api_key: pk.apiKey,
      };

      const res = await fetch('https://app.pakasir.com/api/transactioncreate/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testBody),
      });

      const text = await res.text();
      result.httpStatus = res.status;
      result.responseHeaders = Object.fromEntries(res.headers.entries());

      try {
        result.responseJson = JSON.parse(text);
      } catch {
        result.responseRaw = text.substring(0, 500);
        result.responseIsJson = false;
      }

      // Cek apakah ada payment_number
      const json = result.responseJson;
      if (json?.payment?.payment_number) {
        result.qrStringReceived = true;
        result.qrStringLength = json.payment.payment_number.length;
      } else {
        result.qrStringReceived = false;
        result.hint = 'payment.payment_number tidak ada dalam response. Cek format API Pakasir.';
      }
    } catch (err: any) {
      result.fetchError = err?.message || String(err);
    }
  } else {
    result.skippedTest = true;
    result.hint = 'Slug atau API key kosong. Set di Panel Owner → API atau Pengaturan.';
  }

  return NextResponse.json(result);
}
