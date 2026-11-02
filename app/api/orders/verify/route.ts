import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getPakasir } from '@/lib/server-config';
import { checkPakasirPaid } from '@/lib/pakasir';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/orders/verify?orderId=...
 *
 * Verifikasi pembayaran melalui Pakasir Transaction Detail API.
 * Jika Pakasir melaporkan 'completed', tandai order sebagai 'paid'.
 * Fallback: cek status di DB jika Pakasir tidak tersedia.
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

  // Ambil order
  const { data: order, error: orderErr } = await sb
    .from('orders')
    .select('id, order_code, amount, payment_status, user_id, meta')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
  }

  if (order.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Sudah lunas? Kembalikan langsung
  if (order.payment_status === 'paid') {
    return NextResponse.json({ paid: true, payment_status: 'paid' });
  }

  // Coba verifikasi via Pakasir (v2 jika ada txn_id, fallback v1)
  try {
    const pk = await getPakasir();
    if (pk.slug && pk.apiKey) {
      const meta = (order.meta || {}) as Record<string, any>;
      const r = await checkPakasirPaid(pk, {
        txnId: meta.pakasir_txn_id || null,
        orderId: order.order_code,
        amount: Number(order.amount),
      });

      if (r.paid) {
        // Tandai lunas di DB
        await sb.from('orders').update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', order.id);

        return NextResponse.json({ paid: true, payment_status: 'paid' });
      }
    }
  } catch (err: any) {
    console.error('[verify] Pakasir error:', err?.message || err);
    // Lanjut — fallback ke status DB
  }

  return NextResponse.json({
    paid: false,
    payment_status: order.payment_status,
  });
}
