import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getSprint } from '@/lib/server-config';
import { sprintOrder } from '@/lib/sprintpedia';

/**
 * POST /api/orders/submit-smm
 *
 * Dipanggil setelah pembayaran terkonfirmasi (oleh webhook atau manual).
 * Mengirim order SMM ke SprintPedia via POST /api/order,
 * lalu menyimpan provider_ref (order ID SprintPedia) ke tabel orders.
 *
 * Body: { order_id: string }
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { order_id } = await req.json();
  if (!order_id) {
    return NextResponse.json({ error: 'order_id wajib' }, { status: 400 });
  }

  const sb = createServiceClient();

  // Ambil order
  const { data: order, error: orderErr } = await sb
    .from('orders')
    .select('id, module, product_id, buyer_input, target_input, quantity, process_status, provider_ref, meta')
    .eq('id', order_id)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
  }

  if (order.module !== 'sprintpedia') {
    return NextResponse.json({ error: 'Order ini bukan SMM (SprintPedia)' }, { status: 400 });
  }

  // Jangan kirim ulang jika sudah ada provider_ref
  if (order.provider_ref) {
    return NextResponse.json({
      ok: true,
      message: 'Order sudah dikirim sebelumnya',
      provider_ref: order.provider_ref,
    });
  }

  // Ambil produk untuk mendapatkan provider_code (= SprintPedia service ID)
  if (!order.product_id) {
    return NextResponse.json({ error: 'product_id tidak ada di order ini' }, { status: 400 });
  }

  const { data: product } = await sb
    .from('products')
    .select('provider_code, name')
    .eq('id', order.product_id)
    .single();

  if (!product?.provider_code) {
    return NextResponse.json({ error: 'Produk tidak memiliki provider_code' }, { status: 400 });
  }

  // Ambil konfigurasi SprintPedia
  const cfg = await getSprint();
  if (!cfg.apiKey || !cfg.secretKey) {
    return NextResponse.json({
      error: 'API Key / Secret Key SprintPedia belum diisi di Koneksi & API.',
    }, { status: 400 });
  }

  // Kirim order ke SprintPedia
  const target = order.buyer_input || order.target_input || '';
  const quantity = order.quantity || 1000;

  try {
    const result = await sprintOrder(cfg, product.provider_code, target, quantity, {
      custom_link: order.meta?.custom_link,
      custom_comments: order.meta?.custom_comments,
    });

    // result.data = { id: 1107, price: 10900 }
    // Simpan provider_ref (SprintPedia order ID) dan update status
    await sb.from('orders').update({
      provider_ref: String(result.data.id),
      provider_charge: Number(result.data.price),
      process_status: 'pending',
    }).eq('id', order.id);

    return NextResponse.json({
      ok: true,
      provider_ref: String(result.data.id),
      message: `Order berhasil dikirim ke SprintPedia (ID: ${result.data.id})`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengirim order ke SprintPedia';
    // Update status gagal
    await sb.from('orders').update({
      process_status: 'failed',
      meta: { smm_error: message },
    }).eq('id', order.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
