import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/orders/resume?orderId=...
 *
 * Mengambil data order yang masih pending untuk melanjutkan pembayaran.
 * Mengembalikan qr_string, amount, expires_at, dll.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const orderId = req.nextUrl.searchParams.get('orderId');
  if (!orderId) {
    return NextResponse.json({ error: 'orderId wajib' }, { status: 400 });
  }

  const sb = createServiceClient();
  const { data: order, error } = await sb
    .from('orders')
    .select('id, order_code, product_name, amount, payment_status, qris_url, expires_at, created_at, user_id')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
  }

  // Hanya pemilik order yang boleh lihat
  if (order.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Hanya order pending yang bisa di-resume
  if (order.payment_status !== 'pending') {
    return NextResponse.json({ error: 'Order sudah dibayar atau dibatalkan' }, { status: 400 });
  }

  // Cek apakah sudah expired
  const expiresAt = order.expires_at
    ? new Date(order.expires_at)
    : new Date(new Date(order.created_at).getTime() + 15 * 60 * 1000);

  if (new Date() > expiresAt) {
    return NextResponse.json({ error: 'Order sudah kedaluwarsa' }, { status: 410 });
  }

  return NextResponse.json({
    orderId: order.id,
    orderCode: order.order_code,
    productName: order.product_name,
    amount: Number(order.amount),
    qrString: order.qris_url || null,
    expiresAt: expiresAt.toISOString(),
  });
}
