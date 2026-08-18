import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getJoker } from '@/lib/server-config';
import { jokerStatus } from '@/lib/joker';

/**
 * GET /api/cron/check-smm-status
 *
 * Cron job: Cek status order SMM (JokerPanel) yang masih pending/processing.
 * Dilindungi oleh CRON_SECRET bearer token.
 * Jalankan setiap 5 menit via Vercel Cron atau scheduler lain.
 */

// Mapping status JokerPanel ke status lokal
const STATUS_MAP: Record<string, string> = {
  pending: 'pending',
  processing: 'processing',
  'in progress': 'processing',
  completed: 'success',
  canceled: 'canceled',
  cancelled: 'canceled',
  partial: 'partial',
  refunded: 'canceled',
};

export async function GET(req: Request) {
  // Verifikasi cron secret
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const cfg = await getJoker();
  if (!cfg.apiId || !cfg.apiKey) {
    return NextResponse.json({
      ok: false,
      error: 'JokerPanel belum dikonfigurasi',
      checked: 0,
    });
  }

  const sb = createServiceClient();

  // Ambil order SMM yang masih pending/processing dan punya provider_ref
  const { data: orders, error } = await sb
    .from('orders')
    .select('id, provider_ref, process_status')
    .eq('module', 'jokerpanel')
    .in('process_status', ['pending', 'processing'])
    .not('provider_ref', 'is', null)
    .limit(50); // Batch 50 per cron run

  if (error || !orders) {
    return NextResponse.json({
      ok: false,
      error: error?.message || 'Gagal query orders',
      checked: 0,
    });
  }

  let updated = 0;
  let errors = 0;

  for (const o of orders) {
    try {
      const result = await jokerStatus(cfg, Number(o.provider_ref));
      const rawStatus = (result.order_status || result.status || '').toLowerCase();
      const newStatus = STATUS_MAP[rawStatus] || 'processing';

      // Hanya update jika status berubah
      if (newStatus !== o.process_status) {
        const updateData: Record<string, unknown> = {
          process_status: newStatus,
        };

        // Simpan metadata tambahan jika ada
        if (result.start_count || result.remains) {
          updateData.meta = {
            smm_start_count: result.start_count,
            smm_remains: result.remains,
            smm_charge: result.charge,
            smm_last_check: new Date().toISOString(),
          };
        }

        await sb.from('orders').update(updateData).eq('id', o.id);
        updated++;
      }
    } catch (err: unknown) {
      console.error(`[check-smm-status] Error checking order ${o.id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({
    ok: true,
    total: orders.length,
    updated,
    errors,
  });
}
