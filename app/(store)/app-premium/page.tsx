import { createClient } from '@/lib/supabase/server';
import AppPremiumCheckout from '@/components/store/app-premium-checkout';

export const metadata = { title: 'App Premium' };

export default async function AppPremiumPage() {
  const supabase = await createClient();

  // Ambil produk app premium (manual_app module)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, image_url, description, price_sell')
    .eq('module', 'manual_app')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return (
    <AppPremiumCheckout
      apps={(products ?? []).map(p => ({
        id: p.id,
        name: p.name,
        image_url: p.image_url,
        description: p.description,
        price_sell: Number(p.price_sell),
      }))}
    />
  );
}
