import { createClient } from '@/lib/supabase/server';
import { getNPay, getSettings } from '@/lib/server-config';
import { createNPayQris, listNPayQris } from '@/lib/npay';
import { NextResponse } from 'next/server';

/**
 * GET /api/debug/npay
 *
 * Endpoint diagnostik untuk debug koneksi NPay.
 * Hanya bisa diakses oleh owner.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== 'owner') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const result: Record<string, any> = {};

  // 1. Cek credentials
  const npay = await getNPay();
  result.licenseKey = npay.licenseKey ? `${npay.licenseKey.substring(0, 8)}...${npay.licenseKey.slice(-4)}` : '(KOSONG!)';
  result.webhookSecret = npay.webhookSecret ? `${npay.webhookSecret.substring(0, 8)}...${npay.webhookSecret.slice(-4)}` : '(KOSONG!)';
  result.qrisId = npay.qrisId || '(KOSONG!)';
  result.licenseKeyPresent = !!npay.licenseKey;
  result.webhookSecretPresent = !!npay.webhookSecret;
  result.qrisIdPresent = !!npay.qrisId;

  // 2. Cek test_mode setting
  const settings = await getSettings(['test_mode']);
  result.testMode = settings.test_mode || 'not set';

  // 3. Cek env vars
  result.envNPayLicenseKey = process.env.NPAY_LICENSE_KEY ? 'SET' : 'NOT SET';
  result.envNPayWebhookSecret = process.env.NPAY_WEBHOOK_SECRET ? 'SET' : 'NOT SET';
  result.envNPayQrisId = process.env.NPAY_QRIS_ID ? 'SET' : 'NOT SET';

  // 4. List QRIS devices
  if (npay.licenseKey && npay.webhookSecret) {
    const listResult = await listNPayQris(npay);
    result.qrisList = listResult.ok ? listResult.data : { error: listResult.error };
  }

  // 5. Test create QRIS, amount Rp 1000
  if (npay.licenseKey && npay.webhookSecret && npay.qrisId) {
    const r = await createNPayQris(npay, `TEST-${Date.now()}`, 1000);
    result.testCreate = {
      ok: r.ok,
      txnId: r.txnId,
      totalPayment: r.totalPayment,
      baseAmount: r.baseAmount,
      fee: r.fee,
      qrStringLength: r.qrString?.length ?? 0,
      qrImagePresent: !!r.qrImage,
      error: r.error ?? null,
    };
  } else {
    result.skippedTest = true;
    result.hint = 'License Key, Webhook Secret, atau QRIS ID kosong. Set di Panel Owner → API.';
  }

  return NextResponse.json(result);
}

