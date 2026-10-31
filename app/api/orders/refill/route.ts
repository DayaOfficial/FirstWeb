import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSprint } from '@/lib/server-config';
import { sprintRefill } from '@/lib/sprintpedia';

/**
 * POST /api/orders/refill
 * Request a refill for a completed SMM order.
 * Only works if product.is_refillable === true.
 *
 * Body: { orderId: string }
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

  // Ambil order dengan info produk
  const { data: order, error: orderErr } = await sb
    .from('orders')
    .select('id, provider_ref, module, products!inner(is_refillable, refill_days)')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
  }

  if (order.module !== 'sprintpedia') {
    return NextResponse.json({ error: 'Order ini bukan SMM (SprintPedia)' }, { status: 400 });
  }

  if (!order.provider_ref) {
    return NextResponse.json({ error: 'Order belum dikirim ke provider' }, { status: 400 });
  }

  const product = order.products as any;
  if (!product?.is_refillable) {
    return NextResponse.json({ error: 'Layanan tidak mendukung refill' }, { status: 400 });
  }

  const cfg = await getSprint();
  try {
    const res = await sprintRefill(cfg, order.provider_ref);
    return NextResponse.json({ ok: true, refillId: res.data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
