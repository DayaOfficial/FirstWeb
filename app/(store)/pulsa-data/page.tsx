import { createClient } from '@/lib/supabase/server';
import ProductCheckoutFlow from '@/components/store/product-checkout-flow';

export const metadata = { title: 'Pulsa & Paket Data' };

export default async function PulsaDataPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, name, brand, price_sell, buyer_sku_code')
    .eq('module', 'digiflazz')
    .in('category', ['Pulsa', 'Data'])
    .eq('is_active', true)
    .order('price_sell', { ascending: true });

  return (
    <ProductCheckoutFlow
      title="Pulsa & Paket Data"
      inputLabel="Masukkan Nomor HP"
      inputPlaceholder="08xxxxxxxxxx"
      inputType="tel"
      inputHelper="Nomor akan otomatis mendeteksi operator"
      products={(products ?? []).map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand ?? '',
        price_sell: Number(p.price_sell),
        buyer_sku_code: p.buyer_sku_code ?? '',
      }))}
      category="Pulsa & Data"
      showBrandFilter={true}
    />
  );
}
