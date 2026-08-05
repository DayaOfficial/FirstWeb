import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET — ambil banner aktif (publik, tanpa auth)
export async function GET() {
  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from('banners')
      .select('id, title, image_url, link, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[banners] fetch error:', error.message);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
