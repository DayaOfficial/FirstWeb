import { createClient } from '@/lib/supabase/server';
import ProductCheckoutFlow from '@/components/store/product-checkout-flow';

export const metadata = { title: 'E-Wallet' };

export default async function EWalletPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, name, brand, price_sell, buyer_sku_code')
    .eq('module', 'digiflazz')
    .eq('category', 'E-Wallet')
    .eq('is_active', true)
    .order('price_sell', { ascending: true });

  return (
    <ProductCheckoutFlow
      title="E-Wallet"
      inputLabel="Masukkan Nomor E-Wallet"
      inputPlaceholder="08xxxxxxxxxx"
      inputType="tel"
      inputHelper="Nomor terdaftar di DANA, OVO, GoPay, ShopeePay, dll"
      products={(products ?? []).map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand ?? '',
        price_sell: Number(p.price_sell),
        buyer_sku_code: p.buyer_sku_code ?? '',
      }))}
      category="E-Wallet"
      showBrandFilter={true}
    />
  );
}
