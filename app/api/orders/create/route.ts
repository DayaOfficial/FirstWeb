import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
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
  expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 menit untuk bayar

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

  // TODO: Integrasi Pakasir QRIS — untuk saat ini return placeholder
  // Ketika Pakasir sudah aktif, generate QRIS di sini dan simpan qris_url + payment_ref
  const qrisUrl = null; // Placeholder — akan diganti saat Pakasir dikonfigurasi

  return NextResponse.json({
    orderId: order.id,
    orderCode: order.order_code,
    qrisUrl,
    amount: Number(amount),
    expiresAt: expiresAt.toISOString(),
  });
}
