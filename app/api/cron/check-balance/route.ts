import { createServiceClient } from '@/lib/supabase/server';
import { getDigiflazzBalance, getJokerPanelBalance } from '@/lib/providers/balance';
import { NextResponse } from 'next/server';

/**
 * Cron job: Auto-cek saldo semua provider setiap jam
 * Dilindungi oleh CRON_SECRET bearer token
 *
 * Konfigurasi di Vercel:
 *   vercel.json → crons: [{ path: "/api/cron/check-balance", schedule: "0 * * * *" }]
 */
export async function GET(req: Request) {
  // Verifikasi cron secret
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const checks = await Promise.allSettled([
    getDigiflazzBalance(),
    getJokerPanelBalance(),
  ]);

  const results = [];

  for (const result of checks) {
    if (result.status === 'rejected') continue;
    const c = result.value;

    // Simpan ke riwayat saldo
    await supabase.from('provider_balances').insert({
      provider: c.provider,
      balance: c.balance,
      currency: c.currency,
      raw_response: 'raw' in c ? c.raw : null,
      error: 'error' in c ? c.error : null,
    });

    // Cek threshold — kirim notifikasi jika di bawah batas
    if (!('error' in c)) {
      const { data: thr } = await supabase
        .from('settings')
        .select('value')
        .eq('key', `${c.provider}_min_balance`)
        .single();

      if (thr && c.balance < Number(thr.value)) {
        // Cari ID owner
        const { data: owner } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'owner')
          .limit(1)
          .single();

        if (owner) {
          await supabase.from('notifications').insert({
            user_id: owner.id,
            type: 'saldo_low',
            title: `Saldo ${c.provider === 'digiflazz' ? 'Digiflazz' : 'JokerPanel'} menipis!`,
            message: `Saldo tersisa ${c.currency === 'IDR' ? 'Rp ' : '$ '}${Number(c.balance).toLocaleString('id-ID')}. Segera deposit agar transaksi tidak gagal.`,
            metadata: c,
          });
        }
      }
    }

    results.push(c);
  }

  return NextResponse.json({ ok: true, checked: results.length });
}
