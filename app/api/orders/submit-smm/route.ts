import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getJoker } from '@/lib/server-config';
import { jokerOrder } from '@/lib/joker';

/**
 * POST /api/orders/submit-smm
 *
 * Dipanggil setelah pembayaran terkonfirmasi (oleh webhook atau manual).
 * Mengirim order SMM ke JokerPanel via POST /api/order,
 * lalu menyimpan provider_ref (order ID JokerPanel) ke tabel orders.
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
    .select('id, module, product_id, buyer_input, target_input, quantity, process_status, provider_ref')
    .eq('id', order_id)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
  }

  if (order.module !== 'jokerpanel') {
    return NextResponse.json({ error: 'Order ini bukan SMM (JokerPanel)' }, { status: 400 });
  }

  // Jangan kirim ulang jika sudah ada provider_ref
  if (order.provider_ref) {
    return NextResponse.json({
      ok: true,
      message: 'Order sudah dikirim sebelumnya',
      provider_ref: order.provider_ref,
    });
  }

  // Ambil produk untuk mendapatkan provider_code (= JokerPanel service ID)
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

  // Ambil konfigurasi JokerPanel
  const cfg = await getJoker();
  if (!cfg.apiId || !cfg.apiKey) {
    return NextResponse.json({
      error: 'API ID / API Key JokerPanel belum diisi di Koneksi & API.',
    }, { status: 400 });
  }

  // Kirim order ke JokerPanel
  const target = order.buyer_input || order.target_input || '';
  const quantity = order.quantity || 1000;

  try {
    const result = await jokerOrder(cfg, Number(product.provider_code), target, quantity);

    // Simpan provider_ref (JokerPanel order ID) dan update status
    await sb.from('orders').update({
      provider_ref: String(result.order),
      process_status: 'pending',
    }).eq('id', order.id);

    return NextResponse.json({
      ok: true,
      provider_ref: String(result.order),
      message: `Order berhasil dikirim ke JokerPanel (ID: ${result.order})`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengirim order ke JokerPanel';
    // Update status gagal
    await sb.from('orders').update({
      process_status: 'failed',
      meta: { smm_error: message },
    }).eq('id', order.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
