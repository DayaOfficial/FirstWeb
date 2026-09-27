/**
 * processSmm — Proses order SMM ke SprintPedia secara langsung.
 *
 * Dipanggil langsung dari webhook dan simulate-paid,
 * BUKAN via self-fetch HTTP yang bisa gagal di serverless.
 *
 * Flow:
 * 1. Ambil order dari database
 * 2. Ambil provider_code dari meta atau product table
 * 3. Kirim order ke SprintPedia API /order
 * 4. Simpan provider_ref (SprintPedia order ID) ke database
 */

import { createServiceClient } from '@/lib/supabase/server';
import { getSprint } from '@/lib/server-config';
import { sprintOrder } from '@/lib/sprintpedia';

export interface ProcessSmmResult {
  ok: boolean;
  provider_ref?: string;
  error?: string;
}

export async function processSmm(orderId: string): Promise<ProcessSmmResult> {
  const sb = createServiceClient();

  // 1. Ambil order
  const { data: order, error: orderErr } = await sb
    .from('orders')
    .select('id, module, product_id, buyer_input, target_input, quantity, process_status, provider_ref, meta')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    console.error('[processSmm] Order tidak ditemukan:', orderId, orderErr?.message);
    return { ok: false, error: 'Order tidak ditemukan' };
  }

  if (order.module !== 'sprintpedia') {
    return { ok: false, error: 'Order ini bukan SMM (SprintPedia)' };
  }

  // Jangan kirim ulang jika sudah ada provider_ref
  if (order.provider_ref) {
    console.log('[processSmm] Order sudah dikirim sebelumnya:', order.provider_ref);
    return { ok: true, provider_ref: order.provider_ref };
  }

  // 2. Tentukan provider_code (SprintPedia service ID)
  let providerCode: string | null = null;

  // Dari meta (live-fetch orders — ini yang utama)
  if (order.meta?.smm_provider_code) {
    providerCode = String(order.meta.smm_provider_code);
  }

  // Fallback: dari product table jika product_id ada (synced products)
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
    const errMsg = 'Provider code (SprintPedia service ID) tidak ditemukan';
    console.error('[processSmm]', errMsg, 'orderId:', orderId);
    await sb.from('orders').update({
      process_status: 'failed',
      meta: { ...(order.meta || {}), smm_error: errMsg },
    }).eq('id', order.id);
    return { ok: false, error: errMsg };
  }

  // 3. Ambil konfigurasi SprintPedia
  const cfg = await getSprint();
  if (!cfg.apiKey || !cfg.secretKey) {
    const errMsg = 'API Key / Secret Key SprintPedia belum dikonfigurasi';
    console.error('[processSmm]', errMsg);
    await sb.from('orders').update({
      process_status: 'failed',
      meta: { ...(order.meta || {}), smm_error: errMsg },
    }).eq('id', order.id);
    return { ok: false, error: errMsg };
  }

  // 4. Kirim order ke SprintPedia API
  const target = order.buyer_input || order.target_input || '';
  const quantity = order.quantity || 100;

  console.log('[processSmm] Mengirim ke SprintPedia:', {
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

    console.log('[processSmm] ✅ SprintPedia response:', JSON.stringify(result));

    // Simpan provider_ref (SprintPedia order ID) dan update status
    await sb.from('orders').update({
      provider_ref: String(result.data.id),
      process_status: 'processing',
      meta: {
        ...(order.meta || {}),
        smm_sprint_order_id: result.data.id,
        smm_sprint_price: result.data.price,
        smm_submitted_at: new Date().toISOString(),
      },
    }).eq('id', order.id);

    return { ok: true, provider_ref: String(result.data.id) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengirim order ke SprintPedia';
    console.error('[processSmm] ❌ SprintPedia error:', message);

    await sb.from('orders').update({
      process_status: 'failed',
      meta: {
        ...(order.meta || {}),
        smm_error: message,
        smm_failed_at: new Date().toISOString(),
      },
    }).eq('id', order.id);

    return { ok: false, error: message };
  }
}
