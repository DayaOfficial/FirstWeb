import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { processSmm } from '@/lib/process-smm';

/**
 * POST /api/orders/debug-smm
 * 
 * Debug endpoint — Langsung panggil processSmm untuk order tertentu.
 * Hanya untuk owner. Menampilkan detail error jika gagal.
 * 
 * Body: { order_id: string }
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { order_id } = await req.json();
  if (!order_id) return NextResponse.json({ error: 'order_id wajib' }, { status: 400 });

  const sb = createServiceClient();

  // Ambil order detail
  const { data: order, error: fetchErr } = await sb
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (fetchErr || !order) {
    return NextResponse.json({ 
      error: 'Order tidak ditemukan',
      detail: fetchErr?.message,
      order_id,
    }, { status: 404 });
  }

  // Info debug
  const debug = {
    order_id: order.id,
    order_code: order.order_code,
    module: order.module,
    payment_status: order.payment_status,
    process_status: order.process_status,
    product_id: order.product_id,
    product_name: order.product_name,
    buyer_input: order.buyer_input,
    quantity: order.quantity,
    meta: order.meta,
    provider_ref: order.provider_ref,
  };

  console.log('[debug-smm] Order detail:', JSON.stringify(debug, null, 2));

  // Cek apakah module = sprintpedia
  if (order.module !== 'sprintpedia') {
    return NextResponse.json({
      error: `Module bukan sprintpedia, melainkan: "${order.module}"`,
      debug,
      fix: 'Order harus punya module = "sprintpedia" agar bisa diproses SMM',
    });
  }

  // Cek provider code
  const providerCode = order.meta?.smm_provider_code;
  if (!providerCode) {
    return NextResponse.json({
      error: 'meta.smm_provider_code tidak ada di order ini',
      debug,
      fix: 'Order SMM harus punya meta.smm_provider_code (= SprintPedia service ID)',
    });
  }

  // Langsung proses
  console.log('[debug-smm] Calling processSmm for order:', order_id);
  const result = await processSmm(order_id);

  // Ambil order lagi setelah processSmm
  const { data: updatedOrder } = await sb
    .from('orders')
    .select('process_status, provider_ref, meta')
    .eq('id', order_id)
    .single();

  return NextResponse.json({
    processResult: result,
    debug,
    afterProcess: updatedOrder,
  });
}
