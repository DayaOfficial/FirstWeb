import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/owner/sync-user-meta
 * 
 * One-time fix: Sync profile status ke user_metadata untuk semua user
 * yang sudah approved/rejected di profiles tapi belum di-sync ke JWT metadata.
 * Hanya bisa dijalankan oleh owner.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Cek owner role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || user.user_metadata?.role;
    if (role !== 'owner') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const serviceSupabase = createServiceClient();

    // Ambil semua profiles yang statusnya bukan pending
    const { data: profiles, error: fetchError } = await serviceSupabase
      .from('profiles')
      .select('id, status')
      .in('status', ['approved', 'rejected']);

    if (fetchError) {
      console.error('[sync-user-meta] fetch profiles error:', fetchError.message);
      return NextResponse.json({ error: 'Gagal membaca profiles' }, { status: 500 });
    }

    let synced = 0;
    let failed = 0;

    for (const p of (profiles || [])) {
      const { error: metaError } = await serviceSupabase.auth.admin.updateUserById(p.id, {
        user_metadata: { status: p.status },
      });

      if (metaError) {
        console.error(`[sync-user-meta] failed for user ${p.id}:`, metaError.message);
        failed++;
      } else {
        synced++;
      }
    }

    return NextResponse.json({ success: true, synced, failed, total: (profiles || []).length });
  } catch (err) {
    console.error('[sync-user-meta] unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
