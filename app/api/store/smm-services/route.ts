import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/store/smm-services
 * Returns all SprintPedia SMM services.
 * Uses cookie-based auth (same as owner page).
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('products')
      .select('id, name, brand, price_sell, provider_code, description, min_qty, max_qty, smm_category, service_type, is_refillable, refill_days, platform_icon_url')
      .eq('module', 'sprintpedia')
      .order('brand', { ascending: true });

    if (error) {
      console.error('[smm-services] query error:', error.message);
      return NextResponse.json({ services: [], error: error.message });
    }

    return NextResponse.json({ services: data || [] });
  } catch (err: any) {
    console.error('[smm-services] error:', err.message);
    return NextResponse.json({ services: [], error: err.message });
  }
}
