import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getSettings, getPakasir } from '@/lib/server-config';
import { NextResponse } from 'next/server';
import { generateOrderCode } from '@/lib/utils';

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

  const serviceSupabase = createServiceClient();
  const orderCode = generateOrderCode();

  // Ambil info produk jika product_id ada
  let module = 'manual';
  let resolvedProductName = product_name || nominal_name || 'Produk Digital';

  if (product_id && !product_id.startsWith('fallback-')) {
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

  // Buat order
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 menit untuk bayar

  const { data: order, error } = await serviceSupabase
    .from('orders')
    .insert({
      order_code: orderCode,
      user_id: user.id,
      product_id: (product_id && !product_id.startsWith('fallback-')) ? product_id : null,
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
    })
    .select('id, order_code')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Gagal membuat pesanan: ' + error.message }, { status: 500 });
  }

  // === Integrasi Pakasir QRIS ===
  const testSettings = await getSettings(['test_mode']);
  const testMode = testSettings.test_mode === 'true';

  let qrisUrl: string | null = null;
  let qrString: string | null = null;
  let paymentRef: string | null = null;

  if (!testMode) {
    try {
      const pk = await getPakasir();
      if (pk.slug && pk.apiKey) {
        const pakasirBase = 'https://app.pakasir.com/api';
        const res = await fetch(pakasirBase + '/transactioncreate/qris', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: pk.slug,
            api_key: pk.apiKey,
            amount: Number(amount),
            order_id: orderCode,
          }),
        });
        const qris = await res.json().catch(() => ({}));

        // Toleran field — coba berbagai kemungkinan nama field
        qrisUrl = qris.qr_url || qris.qr || qris.qris || qris.data?.qr_url || qris.data?.qr || null;
        qrString = qris.qr_string || qris.data?.qr_string || null;
        paymentRef = qris.reference || qris.ref || qris.transaction_id || qris.data?.reference || null;

        // Simpan ke order
        if (qrisUrl || qrString || paymentRef) {
          await serviceSupabase.from('orders').update({
            qris_url: qrisUrl,
            payment_ref: paymentRef,
          }).eq('id', order.id);
        }
      }
    } catch (err: any) {
      console.error('[create-order] Pakasir error:', err?.message || err);
      // Lanjut tanpa QR — tidak gagalkan order
    }
  }

  return NextResponse.json({
    orderId: order.id,
    orderCode: order.order_code,
    qrisUrl,
    qrString,
    testMode,
    amount: Number(amount),
    expiresAt: expiresAt.toISOString(),
  });
}
