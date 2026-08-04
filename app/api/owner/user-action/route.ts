import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
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

    const { userId, action } = await req.json();

    if (!userId || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    // Update status di profiles
    const newStatus = action === 'approved' ? 'active' : 'rejected';
    const { error: updateError } = await serviceSupabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId);

    if (updateError) {
      console.error('[user-action] update profile error:', updateError.message);
      return NextResponse.json({ error: 'Gagal mengupdate status user.' }, { status: 500 });
    }

    // Hapus notifikasi terkait user ini setelah action berhasil
    const { error: deleteNotifError } = await serviceSupabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('type', 'registration');

    if (deleteNotifError) {
      console.error('[user-action] delete notification error:', deleteNotifError.message);
      // Tidak fatal — lanjutkan saja
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    console.error('[user-action] unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
