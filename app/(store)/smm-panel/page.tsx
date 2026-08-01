import { createClient } from '@/lib/supabase/server';
import SMMCheckout from '@/components/store/smm-checkout';

export const metadata = { title: 'Sosial Media Marketing' };

export default async function SMMPanelPage() {
  const supabase = await createClient();

  // Ambil layanan SMM (jokerpanel module) yang aktif
  const { data: products } = await supabase
    .from('products')
    .select('id, name, brand, price_sell, provider_service_id, description')
    .eq('module', 'jokerpanel')
    .eq('category', 'SMM')
    .eq('is_active', true)
    .order('brand', { ascending: true });

  return (
    <SMMCheckout
      services={(products ?? []).map(p => ({
        id: p.id,
        name: p.name,
        platform: p.brand ?? 'Lainnya',
        price_per_k: Number(p.price_sell),
        provider_service_id: p.provider_service_id ?? '',
        description: p.description ?? '',
      }))}
    />
  );
}
