import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getSprint } from '@/lib/server-config';
import { sprintOrder } from '@/lib/sprintpedia';

/**
 * POST /api/orders/submit-smm
 *
 * Dipanggil setelah pembayaran terkonfirmasi (oleh webhook atau simulate-paid).
 * Mengirim order SMM ke SprintPedia via API order,
 * lalu menyimpan provider_ref (order ID SprintPedia) ke tabel orders.
 *
 * Body: { order_id: string }
 *
 * PENTING: Endpoint ini dipanggil dari webhook (server-to-server),
 * jadi TIDAK boleh require auth user — gunakan service client saja.
 */
export async function POST(req: Request) {
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
    console.error('[submit-smm] Order tidak ditemukan:', order_id, orderErr?.message);
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

  // Tentukan provider_code (SprintPedia service ID)
  // Prioritas:
  // 1. meta.smm_provider_code (dari live-fetch SMM orders)
  // 2. product -> provider_code (dari synced database products)
  let providerCode: string | null = null;

  // Dari meta (live-fetch orders)
  if (order.meta?.smm_provider_code) {
    providerCode = String(order.meta.smm_provider_code);
  }

  // Fallback: dari product table jika product_id ada
  if (!providerCode && order.product_id) {
    const { data: product } = await sb
      .from('products')
      .select('provider_code')
      .eq('id', order.product_id)
      .single();
    if (product?.provider_code) {
      providerCode = product.provider_code;
    }
  }

  if (!providerCode) {
    console.error('[submit-smm] Tidak ada provider_code untuk order:', order.id);
    await sb.from('orders').update({
      process_status: 'failed',
      meta: { ...order.meta, smm_error: 'Provider code tidak ditemukan' },
    }).eq('id', order.id);
    return NextResponse.json({ error: 'Provider code (SprintPedia service ID) tidak ditemukan di order' }, { status: 400 });
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

  console.log('[submit-smm] Mengirim ke SprintPedia:', {
    service: providerCode,
    target,
    quantity,
    orderId: order.id,
  });

  try {
    const result = await sprintOrder(cfg, providerCode, target, quantity, {
      custom_link: order.meta?.custom_link,
      custom_comments: order.meta?.custom_comments,
    });

    console.log('[submit-smm] ✅ SprintPedia response:', JSON.stringify(result));

    // result.data = { id: 1107, price: 10900 }
    // Simpan provider_ref (SprintPedia order ID) dan update status
    await sb.from('orders').update({
      provider_ref: String(result.data.id),
      process_status: 'processing',
      meta: {
        ...order.meta,
        smm_sprint_order_id: result.data.id,
        smm_sprint_price: result.data.price,
        smm_submitted_at: new Date().toISOString(),
      },
    }).eq('id', order.id);

    return NextResponse.json({
      ok: true,
      provider_ref: String(result.data.id),
      message: `Order berhasil dikirim ke SprintPedia (ID: ${result.data.id})`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengirim order ke SprintPedia';
    console.error('[submit-smm] ❌ SprintPedia error:', message);

    // Update status gagal, simpan error detail
    await sb.from('orders').update({
      process_status: 'failed',
      meta: {
        ...order.meta,
        smm_error: message,
        smm_failed_at: new Date().toISOString(),
      },
    }).eq('id', order.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
