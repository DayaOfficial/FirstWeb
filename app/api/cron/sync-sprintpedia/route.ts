import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { syncSprintPedia } from '@/app/api/owner/products/sync-sprintpedia/route';

/**
 * GET /api/cron/sync-sprintpedia
 *
 * Cron job: Auto-sinkronisasi layanan SprintPedia setiap 24 jam.
 * Dilindungi oleh CRON_SECRET bearer token.
 *
 * Konfigurasi di vercel.json:
 *   crons: [{ path: "/api/cron/sync-sprintpedia", schedule: "0 3 * * *" }]
 *   (setiap hari jam 03:00 WIB)
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const sb = createServiceClient();

  try {
    const result = await syncSprintPedia(sb);

    await sb.from('sync_logs').insert({
      provider: 'sprintpedia',
      action: 'auto_sync',
      total_items: result.total,
      status: result.errors > 0 ? 'partial' : 'success',
      error_message: result.errors > 0 ? `${result.errors} operasi gagal` : null,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    await sb.from('sync_logs').insert({
      provider: 'sprintpedia',
      action: 'auto_sync',
      total_items: 0,
      status: 'error',
      error_message: message,
    });

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
