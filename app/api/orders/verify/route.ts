import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getNPay } from '@/lib/server-config';
import { checkNPayPaid } from '@/lib/npay';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/orders/verify?orderId=...
 *
 * Verifikasi pembayaran melalui NPay Transaction Status API.
 * Jika NPay melaporkan 'paid', tandai order sebagai 'paid'.
 * Fallback: cek status di DB jika NPay tidak tersedia.
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
    .select('id, order_code, amount, payment_status, payment_ref, user_id, meta, module')
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

  // Coba verifikasi via NPay
  try {
    const npay = await getNPay();
    if (npay.licenseKey && npay.webhookSecret) {
      const meta = (order.meta || {}) as Record<string, any>;
      const txnId = meta.npay_txn_id || order.payment_ref;

      if (txnId) {
        const r = await checkNPayPaid(npay, txnId);

        if (r.paid) {
          // Tandai lunas di DB
          const updateData: Record<string, any> = {
            payment_status: 'paid',
            paid_at: r.paidAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Produk manual langsung success
          if (order.module === 'manual_app' || order.module === 'nokos' || order.module === 'manual') {
            updateData.process_status = 'success';
          }

          await sb.from('orders').update(updateData).eq('id', order.id);

          return NextResponse.json({ paid: true, payment_status: 'paid' });
        }
      }
    }
  } catch (err: any) {
    console.error('[verify] NPay error:', err?.message || err);
    // Lanjut — fallback ke status DB
  }

  return NextResponse.json({
    paid: false,
    payment_status: order.payment_status,
  });
}
