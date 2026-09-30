import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/digiflazz/webhook
 *
 * Callback webhook dari Digiflazz saat status transaksi berubah.
 * Digiflazz mengirim POST dengan body:
 * {
 *   "data": {
 *     "ref_id": "...",
 *     "customer_no": "...",
 *     "buyer_sku_code": "...",
 *     "message": "...",
 *     "status": "Sukses" | "Gagal" | "Pending",
 *     "rc": "00",
 *     "sn": "...",
 *     "buyer_last_saldo": ...,
 *     "price": ...
 *   }
 * }
 *
 * IP Digiflazz yang perlu di-whitelist: 52.74.250.133
 */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const d = body.data;
  if (!d || !d.ref_id) {
    return NextResponse.json({ error: 'Invalid callback data' }, { status: 400 });
  }

  console.log('[digiflazz-webhook] Received callback:', JSON.stringify(d));

  const sb = createServiceClient();

  // Cari order berdasarkan order_code (= ref_id)
  const { data: order, error: findErr } = await sb
    .from('orders')
    .select('id, process_status, meta')
    .eq('order_code', d.ref_id)
    .single();

  if (findErr || !order) {
    console.error('[digiflazz-webhook] Order tidak ditemukan:', d.ref_id);
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Map status
  const statusRaw = String(d.status).toLowerCase();
  let processStatus = 'processing';
  if (statusRaw === 'sukses') processStatus = 'success';
  else if (statusRaw === 'gagal') processStatus = 'failed';
  else if (statusRaw === 'pending') processStatus = 'processing';

  // Update order jika status berubah
  const meta = (order.meta || {}) as Record<string, any>;

  await sb.from('orders').update({
    process_status: processStatus,
    meta: {
      ...meta,
      digi_status: d.status,
      digi_message: d.message,
      digi_rc: d.rc,
      digi_sn: d.sn || meta.digi_sn || null,
      digi_price: d.price || meta.digi_price,
      digi_last_saldo: d.buyer_last_saldo,
      digi_last_check: new Date().toISOString(),
    },
  }).eq('id', order.id);

  console.log(`[digiflazz-webhook] Order ${d.ref_id} updated: ${processStatus}`);

  return NextResponse.json({ ok: true });
}
