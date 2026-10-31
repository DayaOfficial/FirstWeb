import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getSprint } from '@/lib/server-config';
import { sprintStatus } from '@/lib/sprintpedia';

/**
 * POST /api/orders/check-smm
 * 
 * Live cek status order SMM dari SprintPedia.
 * Update status di database jika berubah.
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

  const { data: order } = await sb
    .from('orders')
    .select('id, module, provider_ref, process_status, quantity, meta')
    .eq('id', order_id)
    .single();

  if (!order) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
  if (order.module !== 'sprintpedia') return NextResponse.json({ error: 'Bukan order SMM' }, { status: 400 });
  if (!order.provider_ref) return NextResponse.json({ error: 'Order belum dikirim ke provider' }, { status: 400 });

  const cfg = await getSprint();
  if (!cfg.apiKey) return NextResponse.json({ error: 'API key belum dikonfigurasi' }, { status: 500 });

  try {
    const res = await sprintStatus(cfg, order.provider_ref);
    const d = res.data || res;

    // Map status
    const statusMap: Record<string, string> = {
      pending: 'pending',
      processing: 'processing',
      'in progress': 'processing',
      completed: 'success',
      success: 'success',
      sukses: 'success',
      partial: 'success',
      error: 'failed',
      canceled: 'canceled',
      cancelled: 'canceled',
    };
    const newStatus = statusMap[String(d.status).toLowerCase()] || order.process_status;

    // Update database
    const updateData: Record<string, unknown> = {
      process_status: newStatus,
      meta: {
        ...(order.meta || {}),
        smm_start_count: d.start_count != null ? Number(d.start_count) : (order.meta as any)?.smm_start_count,
        smm_remains: d.remains != null ? Number(d.remains) : (order.meta as any)?.smm_remains,
        smm_charge: d.charge || (order.meta as any)?.smm_charge,
        smm_last_check: new Date().toISOString(),
        smm_raw_status: d.status,
      },
    };

    await sb.from('orders').update(updateData).eq('id', order.id);

    return NextResponse.json({
      ok: true,
      status: newStatus,
      raw_status: d.status,
      start_count: d.start_count,
      remains: d.remains,
      quantity: d.quantity || d.charge,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal cek status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
