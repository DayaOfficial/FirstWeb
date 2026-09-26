import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSprint } from '@/lib/server-config';
import { sprintServices } from '@/lib/sprintpedia';

/**
 * POST /api/owner/sprintpedia/test
 * Test SprintPedia connection — fetch services list to verify credentials.
 * Returns service count if credentials are valid.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const cfg = await getSprint();
  if (!cfg.apiKey || !cfg.secretKey) {
    return NextResponse.json(
      { error: 'API Key / Secret Key SprintPedia belum diisi. Simpan dulu di Koneksi & API.' },
      { status: 400 }
    );
  }

  try {
    const json = await sprintServices(cfg);
    const count = Array.isArray(json.data) ? json.data.length : 0;
    return NextResponse.json({
      ok: true,
      services: count,
      message: `Terhubung! ${count} layanan tersedia.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal menghubungi SprintPedia' },
      { status: 400 }
    );
  }
}
