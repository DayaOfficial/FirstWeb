import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/orders/cancel
 * Body: { orderId: string }
 * Cancel an order — only if payment_status is still 'pending'.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { orderId } = await req.json();
  if (!orderId) {
    return NextResponse.json({ error: 'orderId wajib' }, { status: 400 });
  }

  const sb = createServiceClient();

  // Hanya cancel jika masih pending
  const { data: order } = await sb
    .from('orders')
    .select('id, payment_status, user_id')
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
      error: `Tidak bisa membatalkan — status saat ini: ${order.payment_status}`,
    }, { status: 400 });
  }

  const { error } = await sb
    .from('orders')
    .update({
      payment_status: 'canceled',
      process_status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    return NextResponse.json({ error: 'Gagal membatalkan: ' + error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: 'Pesanan dibatalkan' });
}
