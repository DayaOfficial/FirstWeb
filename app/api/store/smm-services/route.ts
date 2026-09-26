import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/store/smm-services
 * Public endpoint — bypass RLS via service client.
 * Returns all active SprintPedia SMM services.
 */
export async function GET() {
  const sb = createServiceClient();

  const { data, error } = await sb
    .from('products')
    .select('id, name, brand, price_sell, provider_code, description, min_qty, max_qty, smm_category, service_type, is_refillable, refill_days, platform_icon_url')
    .eq('module', 'sprintpedia')
    .eq('is_active', true)
    .order('brand', { ascending: true });

  if (error) {
    return NextResponse.json({ services: [], error: error.message });
  }

  return NextResponse.json({ services: data || [] });
}
