import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/server-config';
import { processSmm } from '@/lib/process-smm';
import { NextResponse } from 'next/server';

/**
 * POST /api/orders/simulate-paid
 * Body: { orderId: string }
 * Simulate a successful payment — ONLY active when test_mode = 'true' in settings.
 * Sets payment_status to 'paid' then triggers SMM processing if applicable.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Check test mode
  const settings = await getSettings(['test_mode']);
  if (settings.test_mode !== 'true') {
    return NextResponse.json(
      { error: 'Mode uji tidak aktif. Aktifkan di Pengaturan owner.' },
      { status: 403 }
    );
  }

  const { orderId } = await req.json();
  if (!orderId) {
    return NextResponse.json({ error: 'orderId wajib' }, { status: 400 });
  }

  const sb = createServiceClient();

  const { data: order } = await sb
    .from('orders')
    .select('id, payment_status, user_id, module')
    .eq('id', orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
  }

  if (order.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  if (order.payment_status !== 'pending') {
    return NextResponse.json({
      error: `Status saat ini: ${order.payment_status}, tidak bisa disimulasikan`,
    }, { status: 400 });
  }

  const { error } = await sb
    .from('orders')
    .update({
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: 'test_mode',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    return NextResponse.json({ error: 'Gagal: ' + error.message }, { status: 500 });
  }

  // Jika order SMM, LANGSUNG proses ke SprintPedia (direct call, bukan self-fetch)
  if (order.module === 'sprintpedia') {
    console.log('[simulate-paid] Memproses SMM order langsung:', orderId);
    const smmResult = await processSmm(orderId);
    if (!smmResult.ok) {
      console.error('[simulate-paid] SMM gagal:', smmResult.error);
      return NextResponse.json({
        ok: true,
        message: 'Pembayaran disimulasikan, tapi SMM gagal: ' + smmResult.error,
        smm_error: smmResult.error,
      });
    }
    console.log('[simulate-paid] ✅ SMM berhasil, provider_ref:', smmResult.provider_ref);
    return NextResponse.json({
      ok: true,
      message: `Pembayaran disimulasikan & SMM dikirim (ID: ${smmResult.provider_ref})`,
      provider_ref: smmResult.provider_ref,
    });
  }

  return NextResponse.json({ ok: true, message: 'Pembayaran disimulasikan (mode uji)' });
}
