import { createClient } from '@/lib/supabase/server';
import ProductCheckoutFlow from '@/components/store/product-checkout-flow';

export const metadata = { title: 'Pulsa & Paket Data' };

/**
 * Classify product as Pulsa or Data based on name.
 * Regular pulsa: "{Brand} {nominal}" e.g. "Indosat 5.000", "XL 25.000"
 * Everything else (data, telepon, masa aktif, unlimited, etc.) → Data
 */
function inferCategory(name: string, dbCategory: string | null): string {
  // If DB says Data, trust it
  if (dbCategory === 'Data') return 'Data';

  const n = name.toLowerCase();

  // Detect non-pulsa keywords → Data
  if (/data|internet|\d+\s*gb|\d+\s*mb|kuota|unlimited|telepon|nelpon|menit|masa aktif|voucher/i.test(name)) {
    return 'Data';
  }

  // Regular pulsa pattern: "{Brand} {nominal}" only
  // e.g. "Indosat 5.000", "Telkomsel 10.000", "BY.U 50.000"
  if (/^[a-zA-Z][a-zA-Z.\s]*\s+\d[\d.,]*$/.test(name.trim())) {
    return 'Pulsa';
  }

  // Fallback: if DB says Pulsa and no keywords matched, keep Pulsa
  if (dbCategory === 'Pulsa') return 'Pulsa';

  // Unknown → treat as Data (paket)
  return 'Data';
}

export default async function PulsaDataPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, name, brand, price_sell, provider_code, category')
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
        buyer_sku_code: p.provider_code ?? '',
        category: inferCategory(p.name, p.category),
      }))}
      category="Pulsa & Data"
      showBrandFilter={true}
      showCategoryTabs={true}
    />
  );
}
