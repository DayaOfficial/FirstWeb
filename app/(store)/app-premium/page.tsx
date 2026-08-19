import { createClient } from '@/lib/supabase/server';
import AppPremiumCheckout from '@/components/store/app-premium-checkout';

export const metadata = { title: 'App Premium' };

interface PlanRow {
  id: string;
  product_id: string;
  plan_name: string;
  price: number;
  stock: number;
  is_active: boolean;
}

export default async function AppPremiumPage() {
  const supabase = await createClient();

  // Ambil produk app premium (manual_app module)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, image_url, description, price_sell, brand')
    .eq('module', 'manual_app')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const appList = products ?? [];

  // Ambil semua plans untuk semua apps ini
  const ids = appList.map(a => a.id);
  let planRows: PlanRow[] = [];
  if (ids.length > 0) {
    const { data: plans } = await supabase
      .from('product_plans')
      .select('id, product_id, plan_name, price, stock, is_active')
      .in('product_id', ids)
      .eq('is_active', true)
      .order('price', { ascending: true });
    planRows = (plans ?? []) as PlanRow[];
  }

  // Group plans per app
  const plansByApp: Record<string, { id: string; name: string; price: number; stock: number }[]> = {};
  for (const p of planRows) {
    if (!plansByApp[p.product_id]) plansByApp[p.product_id] = [];
    plansByApp[p.product_id].push({
      id: p.id,
      name: p.plan_name,
      price: p.price,
      stock: p.stock,
    });
  }

  return (
    <AppPremiumCheckout
      apps={appList.map(p => ({
        id: p.id,
        name: p.name,
        image_url: p.image_url,
        description: p.description,
        brand: p.brand,
        price_sell: Number(p.price_sell),
        plans: plansByApp[p.id] || [],
      }))}
    />
  );
}
