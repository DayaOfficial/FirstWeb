import { createServiceClient } from '@/lib/supabase/server';
import { processSmm } from '@/lib/process-smm';
import { NextResponse } from 'next/server';

/**
 * POST /api/payment/webhook
 *
 * Endpoint webhook untuk menerima callback dari Pakasir
 * saat pembayaran QRIS berhasil (status: 'completed').
 *
 * Body dari Pakasir:
 * { amount, order_id, project, status, payment_method, completed_at }
 */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { order_id, amount, status: payStatus, completed_at } = body;

  if (!order_id || !amount) {
    return NextResponse.json({ error: 'order_id dan amount wajib' }, { status: 400 });
  }

  // Hanya proses jika status completed
  if (payStatus !== 'completed') {
    return NextResponse.json({ ok: true, message: `Status '${payStatus}' diterima tapi tidak diproses` });
  }

  const sb = createServiceClient();

  // Cari order berdasarkan order_code
  const { data: order, error: findErr } = await sb
    .from('orders')
    .select('id, order_code, amount, payment_status, module')
    .eq('order_code', order_id)
    .single();

  if (findErr || !order) {
    console.error('[webhook] Order tidak ditemukan:', order_id);
    return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
  }

  // Validasi amount cocok (toleransi ±1 untuk pembulatan)
  if (Math.abs(Number(order.amount) - Number(amount)) > 1) {
    console.error('[webhook] Amount mismatch:', { expected: order.amount, received: amount });
    return NextResponse.json({ error: 'Amount tidak cocok' }, { status: 400 });
  }

  // Sudah dibayar? Skip
  if (order.payment_status === 'paid') {
    return NextResponse.json({ ok: true, message: 'Sudah dibayar sebelumnya' });
  }

  // Tandai sebagai paid
  const { error: updateErr } = await sb
    .from('orders')
    .update({
      payment_status: 'paid',
      paid_at: completed_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
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
