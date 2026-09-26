import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { syncSprintPedia } from '@/app/api/owner/products/sync-sprintpedia/route';

export const maxDuration = 60;

/**
 * GET /api/store/smm-services
 *
 * Endpoint publik untuk store. Mengembalikan semua layanan SMM aktif.
 * Jika belum ada layanan di DB, otomatis trigger sync dari SprintPedia.
 */
export async function GET() {
  const sb = createServiceClient();

  // Cek apakah ada produk sprintpedia di DB
  const { count } = await sb
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('module', 'sprintpedia');

  // Jika belum ada, auto-sync
  if (!count || count === 0) {
    try {
      await syncSprintPedia(sb);
    } catch (err: any) {
      console.error('[smm-services] auto-sync error:', err.message);
      return NextResponse.json({
        services: [],
        error: 'Gagal memuat layanan SMM. Coba lagi nanti.',
      });
    }
  }

  // Ambil semua produk SMM aktif
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
