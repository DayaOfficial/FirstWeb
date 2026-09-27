import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getSprint } from '@/lib/server-config';
import { sprintStatusBulk } from '@/lib/sprintpedia';

/**
 * GET /api/cron/check-smm-status
 *
 * Cron job: Cek status order SMM (SprintPedia) yang masih pending/processing/partial.
 * Dilindungi oleh CRON_SECRET bearer token.
 * Jalankan setiap 15 menit via Vercel Cron atau scheduler lain.
 *
 * Menggunakan batch status check (max 100 ID per request) untuk efisiensi.
 */

// Mapping status SprintPedia ke status lokal
function mapStatus(s: string): string {
  switch (s) {
    case 'Pending':    return 'pending';
    case 'Processing': return 'processing';
    case 'Success':    return 'success';
    case 'Partial':    return 'partial';
    case 'Error':      return 'failed';
    default:           return 'processing';
  }
}

export async function GET(req: Request) {
  // Verifikasi cron secret
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const cfg = await getSprint();
  if (!cfg.apiKey || !cfg.secretKey) {
    return NextResponse.json({
      ok: false,
      error: 'SprintPedia belum dikonfigurasi',
      checked: 0,
    });
  }

  const sb = createServiceClient();

  // Ambil order SMM yang masih pending/processing/partial dan punya provider_ref
  const { data: orders, error } = await sb
    .from('orders')
    .select('id, provider_ref, process_status')
    .eq('module', 'sprintpedia')
    .in('process_status', ['pending', 'processing', 'partial'])
    .not('provider_ref', 'is', null)
    .limit(200) as { data: { id: string; provider_ref: string; process_status: string }[] | null; error: any };

  if (error || !orders) {
    return NextResponse.json({
      ok: false,
      error: error?.message || 'Gagal query orders',
      checked: 0,
    });
  }

  if (!orders.length) {
    return NextResponse.json({ ok: true, checked: 0, updated: 0 });
  }

  const ids = orders.map(o => o.provider_ref);
  let updated = 0;
  let errors = 0;

  // Batch max 100 IDs per request
  for (let i = 0; i < ids.length; i += 100) {
    try {
      const batchIds = ids.slice(i, i + 100);
      const res = await sprintStatusBulk(cfg, batchIds);
      // API v2 response bisa: {orders: {...}}, atau langsung object keyed by ID, atau {data: {...}}
      const statusMap = res.orders || res.data || (typeof res === 'object' && !Array.isArray(res) ? res : {});

      for (const o of orders.slice(i, i + 100)) {
        const s = statusMap[o.provider_ref];
        if (!s?.status) continue;

        const newStatus = mapStatus(s.status);

        // Hanya update jika status berubah
        if (newStatus !== o.process_status) {
          const updateData: Record<string, unknown> = {
            process_status: newStatus,
          };

          // Simpan metadata tambahan jika ada
          if (s.start_count || s.remains) {
            updateData.meta = {
              smm_start_count: s.start_count,
              smm_remains: s.remains,
              smm_charge: s.charge,
              smm_last_check: new Date().toISOString(),
            };
          }

          await sb.from('orders').update(updateData).eq('id', o.id);
          updated++;
        }
      }
    } catch (err: unknown) {
      console.error(`[check-smm-status] Batch error at offset ${i}:`, err);
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
