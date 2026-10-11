/**
 * processDigiflazz — Gateway transaksi Digiflazz (prepaid).
 *
 * Mirip processSmm, function ini:
 * 1. Ambil order dari DB
 * 2. Validasi status & module
 * 3. Kirim topup ke Digiflazz API
 * 4. Update order dengan result (provider_ref, SN, status)
 *
 * Dipanggil dari:
 * - webhook/route.ts (saat QRIS paid)
 * - simulate-paid/route.ts (test mode)
 */
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { getDigiflazz, fetchJson } from '@/lib/server-config';

const BASE = 'https://api.digiflazz.com/v1';

export async function processDigiflazz(orderId: string): Promise<{
  ok: boolean;
  error?: string;
  ref_id?: string;
  sn?: string;
  status?: string;
}> {
  const sb = createServiceClient();

  // 1. Ambil order
  const { data: order, error: orderErr } = await sb
    .from('orders')
    .select('id, module, product_id, buyer_input, quantity, process_status, provider_ref, meta, order_code')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    console.error('[processDigiflazz] Order tidak ditemukan:', orderId, orderErr?.message);
    return { ok: false, error: 'Order tidak ditemukan' };
  }

  if (order.module !== 'digiflazz') {
    return { ok: false, error: 'Order ini bukan Digiflazz' };
  }

  // Sudah diproses sebelumnya?
  if (order.provider_ref && order.process_status === 'success') {
    return { ok: true, ref_id: order.provider_ref, status: 'success' };
  }

  // 2. Ambil buyer_sku_code dari meta atau product
  const meta = (order.meta || {}) as Record<string, any>;
  let buyerSkuCode = meta.buyer_sku_code || '';

  if (!buyerSkuCode && order.product_id) {
    const { data: prod } = await sb
      .from('products')
      .select('provider_code')
      .eq('id', order.product_id)
      .single();
    buyerSkuCode = prod?.provider_code || '';
  }

  if (!buyerSkuCode) {
    const errMsg = 'buyer_sku_code tidak ditemukan';
    await sb.from('orders').update({
      process_status: 'failed',
      meta: { ...meta, digi_error: errMsg },
    }).eq('id', order.id);
    return { ok: false, error: errMsg };
  }

  // 3. Ambil customer_no (nomor tujuan)
  const customerNo = order.buyer_input || meta.customer_no || '';
  if (!customerNo) {
    const errMsg = 'Nomor tujuan (customer_no) kosong';
    await sb.from('orders').update({
      process_status: 'failed',
      meta: { ...meta, digi_error: errMsg },
    }).eq('id', order.id);
    return { ok: false, error: errMsg };
  }

  // 4. Dapatkan credentials
  const cfg = await getDigiflazz();
  if (!cfg.username || !cfg.apiKey) {
    const errMsg = 'Konfigurasi Digiflazz belum ada';
    await sb.from('orders').update({
      process_status: 'failed',
      meta: { ...meta, digi_error: errMsg },
    }).eq('id', order.id);
    return { ok: false, error: errMsg };
  }

  // 5. Buat ref_id unik (gunakan order_code agar idempoten)
  const refId = order.order_code || `DM-${orderId.substring(0, 8)}`;

  // 6. Kirim ke Digiflazz — coba apiKey dulu, fallback ke prodKey jika signature gagal
  const testing = process.env.DIGIFLAZZ_TESTING === 'true';
  const keysToTry = [cfg.apiKey, cfg.prodKey].filter(Boolean);

  console.log('[processDigiflazz] Mengirim ke Digiflazz:', {
    buyer_sku_code: buyerSkuCode,
    customer_no: customerNo,
    ref_id: refId,
    testing,
    keys_available: keysToTry.length,
  });

  let lastError = '';

  for (const currentKey of keysToTry) {
    const sign = crypto
      .createHash('md5')
      .update(cfg.username + currentKey + refId)
      .digest('hex');

    try {
      const json = await fetchJson(`${BASE}/transaction`, {
        username: cfg.username,
        buyer_sku_code: buyerSkuCode,
        customer_no: customerNo,
        ref_id: refId,
        sign,
        testing,
      });

      const d = json.data;
      console.log('[processDigiflazz] Response:', JSON.stringify(d));

      // Jika signature salah, coba key berikutnya
      if (d?.rc === '41' && keysToTry.length > 1) {
        console.log('[processDigiflazz] Signature salah, mencoba key lain...');
        lastError = d?.message || 'Signature salah';
        continue;
      }

      // Map Digiflazz status ke internal status
      const statusRaw = String(d?.status || '').toLowerCase();
      let processStatus = 'processing';
      if (statusRaw === 'sukses') processStatus = 'success';
      else if (statusRaw === 'gagal') processStatus = 'failed';
      else if (statusRaw === 'pending') processStatus = 'processing';

      // Update order
      await sb.from('orders').update({
        provider_ref: refId,
        process_status: processStatus,
        meta: {
          ...meta,
          buyer_sku_code: buyerSkuCode,
          customer_no: customerNo,
          digi_status: d?.status,
          digi_message: d?.message,
          digi_rc: d?.rc,
          digi_sn: d?.sn || null,
          digi_price: d?.price,
          digi_last_saldo: d?.buyer_last_saldo,
          digi_last_check: new Date().toISOString(),
        },
      }).eq('id', order.id);

      if (processStatus === 'failed') {
        return { ok: false, error: d?.message || 'Transaksi gagal', ref_id: refId, status: processStatus };
      }

      return {
        ok: true,
        ref_id: refId,
        sn: d?.sn || undefined,
        status: processStatus,
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : 'Gagal menghubungi Digiflazz';
      console.error('[processDigiflazz] Error dengan key:', lastError);
      continue;
    }
  }

  // Semua key gagal
  console.error('[processDigiflazz] Semua key gagal:', lastError);
  await sb.from('orders').update({
    process_status: 'failed',
    meta: { ...meta, digi_error: lastError },
  }).eq('id', order.id);

  return { ok: false, error: lastError };
}
