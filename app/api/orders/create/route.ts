import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getSettings, getNPay } from '@/lib/server-config';
import { NextResponse } from 'next/server';
import { generateOrderCode } from '@/lib/utils';
import { createNPayQris } from '@/lib/npay';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 });
  }

  const body = await req.json();
  const {
    product_id,
    product_name,
    target_input,
    nominal_code,
    nominal_name,
    amount,
    quantity: rawQuantity,
    duration,
    buyer_name,
    buyer_phone,
  } = body;

  // SMM orders pass actual quantity (e.g. 5000); default to 1 for non-SMM
  const quantity = Number(rawQuantity) || 1;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Jumlah pembayaran tidak valid' }, { status: 400 });
  }

  if (amount < 500) {
    return NextResponse.json({ error: 'Minimum pembayaran QRIS adalah Rp 500' }, { status: 400 });
  }

  const serviceSupabase = createServiceClient();
  const orderCode = generateOrderCode();

  // Ambil info produk jika product_id ada
  let module = 'manual';
  let resolvedProductName = product_name || nominal_name || 'Produk Digital';

  if (product_id && !product_id.startsWith('fallback-')) {
    // Validate UUID format before querying
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(product_id)) {
      const { data: product } = await serviceSupabase
        .from('products')
        .select('name, module, provider_code')
        .eq('id', product_id)
        .single();

      if (product) {
        module = product.module;
        resolvedProductName = product_name || product.name;
      }
    }
  }

  // SMM orders: product_id is null but nominal_code is SprintPedia service ID
  if (!product_id && nominal_code && product_name?.includes('SMM')) {
    module = 'sprintpedia';
  }

  // Buat order
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 menit untuk bayar

  // Build metadata for SMM orders
  const meta: Record<string, any> = {};
  if (module === 'sprintpedia' && nominal_code) {
    meta.smm_provider_code = nominal_code;
    meta.smm_quantity = quantity;
    meta.smm_service_name = nominal_name || product_name;
  }

  // Build metadata for Digiflazz orders — store buyer_sku_code for processDigiflazz
  if (module === 'digiflazz' && nominal_code) {
    meta.buyer_sku_code = nominal_code;
    meta.customer_no = target_input || '';
  }

  const { data: order, error } = await serviceSupabase
    .from('orders')
    .insert({
      order_code: orderCode,
      user_id: user.id,
      product_id: (product_id && !product_id.startsWith('fallback-') && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product_id)) ? product_id : null,
      module,
      product_name: resolvedProductName,
      quantity,
      amount: Number(amount),
      buyer_name: buyer_name || null,
      buyer_phone: buyer_phone || null,
      buyer_input: target_input || null,
      payment_status: 'pending',
      payment_method: 'qris',
      process_status: 'waiting',
      expires_at: expiresAt.toISOString(),
      meta: Object.keys(meta).length > 0 ? meta : null,
    })
    .select('id, order_code')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Gagal membuat pesanan: ' + error.message }, { status: 500 });
  }

  // === Integrasi NPay QRIS ===

  // Test mode HANYA untuk owner — member selalu pakai NPay production
  const userRole = user.user_metadata?.role;
  let testMode = false;
  if (userRole === 'owner') {
    const testSettings = await getSettings(['test_mode']);
    testMode = testSettings.test_mode === 'true';
  }

  let qrString: string | null = null;
  let qrImage: string | null = null;
  let npayExpiresAt: string | null = null;
  let totalPayment: number | null = null;
  let npayError: string | null = null;

  if (!testMode) {
    try {
      const npay = await getNPay();
      console.log('[NPay] Creating QRIS:', { qrisId: npay.qrisId, order_id: orderCode, amount: Number(amount) });

      const r = await createNPayQris(npay, orderCode, Number(amount));

      if (r.ok && (r.qrString || r.qrImage)) {
        qrString = r.qrString;
        qrImage = r.qrImage;
        npayExpiresAt = r.expiredAt;
        totalPayment = r.totalPayment;

        // Simpan QR + referensi ke order agar bisa di-resume
        await serviceSupabase.from('orders').update({
          payment_ref: r.txnId || orderCode,
          qris_url: qrString || qrImage,
          ...(npayExpiresAt ? { expires_at: npayExpiresAt } : {}),
          meta: {
            ...meta,
            npay_txn_id: r.txnId,
            npay_fee: r.fee,
            npay_total: r.totalPayment,
            npay_base_amount: r.baseAmount,
            npay_sumber: r.sumber,
            npay_qr_image: r.qrImage,
          },
        }).eq('id', order.id);

        console.log(`[NPay] ✅ QR diterima, txn: ${r.txnId}, panjang qr_string:`, qrString?.length ?? 0);
      } else {
        npayError = r.error || 'QR tidak diterima dari NPay';
        console.error('[NPay] Gagal:', npayError);
        await serviceSupabase.from('orders').update({
          meta: { ...meta, npay_error: npayError },
        }).eq('id', order.id);
      }
    } catch (err: any) {
      npayError = err?.message || String(err);
      console.error('[NPay] Error:', npayError);
      // Lanjut tanpa QR — tidak gagalkan order
    }
  }

  return NextResponse.json({
    orderId: order.id,
    orderCode: order.order_code,
    qrString,
    qrImage,
    testMode,
    amount: Number(amount),
    totalPayment,
    npayError,
    expiresAt: npayExpiresAt || expiresAt.toISOString(),
  });
}
