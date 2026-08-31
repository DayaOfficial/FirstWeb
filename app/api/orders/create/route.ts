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

  let qrString: string | null = null;
  let totalPayment: number = Number(amount);
  let paymentRef: string | null = null;
  let pakasirExpiresAt: string | null = null;

  if (!testMode) {
    try {
      const pk = await getPakasir();
      if (pk.slug && pk.apiKey) {
        const pakasirBase = 'https://app.pakasir.com/api';
        const res = await fetch(pakasirBase + '/transactioncreate/qris', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: pk.slug,           // slug proyek — sesuai dokumentasi Pakasir
            order_id: orderCode,
            amount: Number(amount),
            api_key: pk.apiKey,
          }),
        });
        const json = await res.json().catch(() => ({}));

        // Pakasir mengembalikan QR string di payment.payment_number
        // Bukan URL gambar — render menjadi gambar adalah tanggung jawab merchant
        const pay = json?.payment;
        if (pay?.payment_number) {
          qrString = pay.payment_number;
          totalPayment = Number(pay.total_payment) || Number(amount);
          pakasirExpiresAt = pay.expired_at || null;
          paymentRef = pay.reference || pay.id || null;
        } else {
          // Fallback: coba field-field alternatif (backward compat)
          qrString = json.qr_string || json.data?.qr_string || null;
          paymentRef = json.reference || json.ref || json.transaction_id || json.data?.reference || null;
        }

        // Simpan referensi ke order
        if (qrString || paymentRef) {
          await serviceSupabase.from('orders').update({
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
    qrString,
    totalPayment,
    testMode,
    amount: Number(amount),
    expiresAt: pakasirExpiresAt || expiresAt.toISOString(),
  });
}
