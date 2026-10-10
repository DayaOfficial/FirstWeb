import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { getDigiflazz, fetchJson } from '@/lib/server-config';

/**
 * GET /api/cron/check-digiflazz-status
 *
 * Cek status transaksi Digiflazz yang masih Pending/Processing.
 * Dipanggil manual atau bisa dijadikan cron harian.
 * Alternatif webhook: polling status via Digiflazz inquiry API.
 */
export const maxDuration = 30;

export async function GET(req: Request) {
  // Auth: CRON_SECRET atau owner session
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const sb = createServiceClient();

  // Cari order Digiflazz yang masih processing (max 50, dalam 7 hari terakhir)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: orders } = await sb
    .from('orders')
    .select('id, order_code, product_id, meta, process_status')
    .eq('module', 'digiflazz')
    .eq('process_status', 'processing')
    .eq('payment_status', 'paid')
    .gte('created_at', sevenDaysAgo.toISOString())
    .limit(50);

  if (!orders || orders.length === 0) {
    return NextResponse.json({ message: 'Tidak ada transaksi pending', checked: 0 });
  }

  const cfg = await getDigiflazz();
  if (!cfg.username || !cfg.apiKey) {
    return NextResponse.json({ error: 'Digiflazz belum dikonfigurasi' }, { status: 500 });
  }

  let updated = 0;
  let stillPending = 0;

  for (const order of orders) {
    const meta = (order.meta || {}) as Record<string, any>;
    const buyerSkuCode = meta.buyer_sku_code || '';
    const customerNo = meta.customer_no || '';
    const refId = order.order_code;

    if (!buyerSkuCode || !refId) continue;

    try {
      // Kirim ulang transaksi dengan ref_id yang sama
      // Digiflazz akan return status terbaru tanpa double-charge
      const sign = crypto
        .createHash('md5')
        .update(cfg.username + cfg.apiKey + refId)
        .digest('hex');

      const json = await fetchJson('https://api.digiflazz.com/v1/transaction', {
        username: cfg.username,
        buyer_sku_code: buyerSkuCode,
        customer_no: customerNo,
        ref_id: refId,
        sign,
      });

      const d = json.data;
      const statusRaw = String(d?.status || '').toLowerCase();
      let processStatus = 'processing';
      if (statusRaw === 'sukses') processStatus = 'success';
      else if (statusRaw === 'gagal') processStatus = 'failed';

      if (processStatus !== 'processing') {
        await sb.from('orders').update({
          process_status: processStatus,
          meta: {
            ...meta,
            digi_status: d?.status,
            digi_message: d?.message,
            digi_rc: d?.rc,
            digi_sn: d?.sn || meta.digi_sn || null,
            digi_price: d?.price || meta.digi_price,
            digi_last_saldo: d?.buyer_last_saldo,
            digi_last_check: new Date().toISOString(),
          },
        }).eq('id', order.id);
        updated++;
        console.log(`[check-digi] Order ${refId}: ${processStatus}`);
      } else {
        stillPending++;
      }
    } catch (err) {
      console.error(`[check-digi] Error checking ${refId}:`, err);
    }
  }

  return NextResponse.json({
    checked: orders.length,
    updated,
    still_pending: stillPending,
  });
}
