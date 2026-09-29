import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { processSmm } from '@/lib/process-smm';

/**
 * POST /api/orders/retry-smm
 * 
 * Retry semua order SMM yang sudah dibayar tapi belum diproses.
 * Hanya untuk owner.
 * 
 * Ini mengatasi kasus di mana:
 * 1. simulate-paid versi lama tidak memanggil processSmm
 * 2. Webhook gagal karena self-fetch pattern
 * 3. SprintPedia API sempat down saat order dibayar
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Cek role owner
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'owner') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const sb = createServiceClient();

  // Ambil semua order SMM yang paid tapi masih waiting/failed
  const { data: orders, error } = await sb
    .from('orders')
    .select('id, order_code, process_status')
    .eq('module', 'sprintpedia')
    .eq('payment_status', 'paid')
    .in('process_status', ['waiting', 'failed'])
    .is('provider_ref', null)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ ok: true, message: 'Tidak ada order SMM yang perlu di-retry', retried: 0 });
  }

  const results: any[] = [];

  for (const order of orders) {
    console.log(`[retry-smm] Processing order ${order.order_code} (${order.id})`);
    const result = await processSmm(order.id);
    results.push({
      order_code: order.order_code,
      ...result,
    });
  }

  const success = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;

  return NextResponse.json({
    ok: true,
    total: orders.length,
    success,
    failed,
    results,
  });
}
