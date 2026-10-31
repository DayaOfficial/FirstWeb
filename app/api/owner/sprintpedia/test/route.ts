import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSprint } from '@/lib/server-config';
import { sprintBalance } from '@/lib/sprintpedia';

/**
 * POST /api/owner/sprintpedia/test
 * Test SprintPedia connection — fetch balance to verify credentials.
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
    const json = await sprintBalance(cfg);
    const balance = Number(json.data?.balance ?? json.balance ?? 0);
    return NextResponse.json({
      ok: true,
      balance,
      currency: 'IDR',
      message: `Terhubung! Saldo: Rp ${balance.toLocaleString('id-ID')}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal menghubungi SprintPedia' },
      { status: 400 }
    );
  }
}
