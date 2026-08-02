import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    // Validasi server-side
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Semua field wajib diisi.' }, { status: 400 });
    }

    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: 'Username minimal 3 karakter (huruf, angka, underscore).' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter.' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Buat user via admin API — TANPA email confirmation
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // Otomatis konfirmasi — tidak kirim email
      user_metadata: {
        username: username.trim(),
        role: 'user',
      },
    });

    if (createError) {
      if (createError.message.includes('already') || createError.message.includes('exists') || createError.message.includes('duplicate')) {
        return NextResponse.json({ error: 'Email sudah terdaftar. Silakan login.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Gagal mendaftar. Coba lagi nanti.' }, { status: 500 });
    }

    // Insert profil ke tabel profiles
    if (newUser?.user) {
      await supabase.from('profiles').upsert({
        id: newUser.user.id,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        role: 'user',
        status: 'pending',
      }, { onConflict: 'id' });

      // Kirim notifikasi ke owner
      await supabase.from('notifications').insert({
        type: 'registration',
        title: `Registrasi Baru: ${username.trim()}`,
        message: `User ${username.trim()} (${email.trim().toLowerCase()}) mendaftar dan menunggu persetujuan.`,
        user_id: newUser.user.id,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        is_read: false,
      });
    }

    return NextResponse.json({ success: true, message: 'Registrasi berhasil!' });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
