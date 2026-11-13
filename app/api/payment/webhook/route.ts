import { createServiceClient } from '@/lib/supabase/server';
import { getNPay } from '@/lib/server-config';
import { verifyNPaySignature } from '@/lib/npay';
import { processSmm } from '@/lib/process-smm';
import { NextResponse } from 'next/server';

/**
 * POST /api/payment/webhook
 *
 * Endpoint webhook untuk menerima callback dari NPay
 * saat pembayaran QRIS berhasil.
 *
 * NPay payload:
 * { event: "transaction.paid", id, amount, status, source, sumber_order, created_at, paid_at }
 *
 * Header: X-NPay-Signature = HMAC-SHA256(body, webhook_secret)
 */
export async function POST(req: Request) {
  // Baca raw body dulu untuk verifikasi signature
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'Gagal membaca body' }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Verifikasi HMAC signature
  const signature = req.headers.get('x-npay-signature') || '';
  const npay = await getNPay();

  if (npay.webhookSecret && signature) {
    if (!verifyNPaySignature(rawBody, signature, npay.webhookSecret)) {
      console.error('[webhook] Signature NPay tidak valid');
      return NextResponse.json({ error: 'Signature tidak valid' }, { status: 401 });
    }
  }

  const { event, id: txnId, amount, status: payStatus, paid_at, sumber_order } = payload;

  // Hanya proses event transaction.paid
  if (event && event !== 'transaction.paid') {
    return NextResponse.json({ ok: true, message: `Event '${event}' diterima tapi tidak diproses` });
  }

  // Fallback: cek status field jika event tidak ada
  if (!event && payStatus !== 'paid') {
    return NextResponse.json({ ok: true, message: `Status '${payStatus}' diterima tapi tidak diproses` });
  }

  if (!txnId) {
    return NextResponse.json({ error: 'Transaction ID (id) wajib' }, { status: 400 });
  }

  const sb = createServiceClient();

  // Cari order berdasarkan payment_ref (NPay txn_id) atau meta.npay_txn_id
  let order: any = null;

  // Coba cari via payment_ref dulu
  const { data: byRef } = await sb
    .from('orders')
    .select('id, order_code, amount, payment_status, module')
    .eq('payment_ref', txnId)
    .single();

  if (byRef) {
    order = byRef;
  } else {
    // Fallback: cari di meta jsonb
    const { data: byMeta } = await sb
      .from('orders')
      .select('id, order_code, amount, payment_status, module')
      .contains('meta', { npay_txn_id: txnId })
      .single();

    order = byMeta;
  }

  if (!order) {
    // Coba juga via sumber_order (format: dayamart-ORDER_CODE)
    if (sumber_order) {
      const orderCode = sumber_order.replace(/^dayamart-/, '');
      const { data: bySumber } = await sb
        .from('orders')
        .select('id, order_code, amount, payment_status, module')
        .eq('order_code', orderCode)
        .single();
      order = bySumber;
    }
  }

  if (!order) {
    console.error('[webhook] Order tidak ditemukan untuk txn:', txnId);
    return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
  }

  // Sudah dibayar? Skip
  if (order.payment_status === 'paid') {
    return NextResponse.json({ ok: true, message: 'Sudah dibayar sebelumnya' });
  }

  // Tandai sebagai paid
  const updateData: Record<string, any> = {
    payment_status: 'paid',
    paid_at: paid_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Untuk produk manual (nokos, app_premium, manual_app), langsung set process_status = success
  // karena tidak ada proses otomatis — owner akan memproses secara manual setelah melihat pesanan
  if (order.module === 'manual_app' || order.module === 'nokos' || order.module === 'manual') {
    updateData.process_status = 'success';
  }

  const { error: updateErr } = await sb
    .from('orders')
    .update(updateData)
    .eq('id', order.id);

  if (updateErr) {
    console.error('[webhook] Update error:', updateErr.message);
    return NextResponse.json({ error: 'Gagal update order' }, { status: 500 });
  }

  // Jika order SMM (sprintpedia), LANGSUNG proses ke SprintPedia
  // Tidak pakai self-fetch — langsung panggil function
  if (order.module === 'sprintpedia') {
    console.log('[webhook] Memproses SMM order langsung:', order.id);
    const smmResult = await processSmm(order.id);
    if (!smmResult.ok) {
      console.error('[webhook] SMM processing gagal:', smmResult.error);
    } else {
      console.log('[webhook] ✅ SMM berhasil dikirim, provider_ref:', smmResult.provider_ref);
    }
  }

  // Jika order Digiflazz (topup game, pulsa, token dll), proses langsung
  if (order.module === 'digiflazz') {
    const { processDigiflazz } = await import('@/lib/process-digiflazz');
    console.log('[webhook] Memproses Digiflazz order langsung:', order.id);
    const digiResult = await processDigiflazz(order.id);
    if (!digiResult.ok) {
      console.error('[webhook] Digiflazz processing gagal:', digiResult.error);
    } else {
      console.log('[webhook] ✅ Digiflazz berhasil, ref_id:', digiResult.ref_id, 'SN:', digiResult.sn);
    }
  }

  return NextResponse.json({ ok: true, message: 'Pembayaran dikonfirmasi' });
}
