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

    const { userId, confirmUsername } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId wajib diisi' }, { status: 400 });
    }

    // Tidak boleh hapus diri sendiri
    if (userId === user.id) {
      return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri.' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    // Ambil data user target untuk verifikasi
    const { data: targetProfile } = await serviceSupabase
      .from('profiles')
      .select('username, role')
      .eq('id', userId)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
    }

    // Tidak boleh hapus owner lain
    if (targetProfile.role === 'owner') {
      return NextResponse.json({ error: 'Tidak bisa menghapus akun owner.' }, { status: 403 });
    }

    // Verifikasi konfirmasi username
    if (confirmUsername !== targetProfile.username) {
      return NextResponse.json({ error: 'Konfirmasi username tidak cocok.' }, { status: 400 });
    }

    // Hapus user dari auth (profile terhapus otomatis via CASCADE)
    const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('[user-delete] delete error:', deleteError.message);
      return NextResponse.json({ error: 'Gagal menghapus user.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `User ${targetProfile.username} berhasil dihapus.` });
  } catch (err) {
    console.error('[user-delete] unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
