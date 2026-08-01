import { createClient } from '@/lib/supabase/server';
import ProductCheckoutFlow from '@/components/store/product-checkout-flow';

export const metadata = { title: 'Token Listrik & Tagihan' };

export default async function TokenTagihanPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, name, brand, price_sell, buyer_sku_code')
    .eq('module', 'digiflazz')
    .in('category', ['PLN', 'Token'])
    .eq('is_active', true)
    .order('price_sell', { ascending: true });

  return (
    <ProductCheckoutFlow
      title="Token Listrik & Tagihan"
      inputLabel="Masukkan Nomor Meter / ID Pelanggan"
      inputPlaceholder="Contoh: 12345678901"
      inputType="text"
      inputHelper="Nomor meter ada di meteran listrik atau struk PLN"
      products={(products ?? []).map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand ?? '',
        price_sell: Number(p.price_sell),
        buyer_sku_code: p.buyer_sku_code ?? '',
      }))}
      category="Token & Tagihan"
      showBrandFilter={false}
    />
  );
}
