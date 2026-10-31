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

    // Cek env
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[register] SUPABASE_SERVICE_ROLE_KEY is not set!');
      return NextResponse.json({ error: 'Konfigurasi server belum lengkap.' }, { status: 500 });
    }

    const supabase = createServiceClient();

    // Buat user via admin API — TANPA email confirmation
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        username: username.trim(),
        role: 'user',
      },
    });

    if (createError) {
      console.error('[register] createUser error:', createError.message);
      if (createError.message.includes('already') || createError.message.includes('exists') || createError.message.includes('duplicate')) {
        return NextResponse.json({ error: 'Email sudah terdaftar. Silakan login.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Gagal mendaftar. Coba lagi nanti.' }, { status: 500 });
    }

    // Insert profil ke tabel profiles
    if (newUser?.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: newUser.user.id,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        role: 'user',
        status: 'pending',
      }, { onConflict: 'id' });

      if (profileError) {
        console.error('[register] profile upsert error:', profileError.message);
      }

      // Kirim notifikasi ke owner — gunakan kolom yang ada di tabel
      const { error: notifError } = await supabase.from('notifications').insert({
        type: 'registration',
        title: `Registrasi Baru: ${username.trim()}`,
        message: `User ${username.trim()} (${email.trim().toLowerCase()}) mendaftar dan menunggu persetujuan.`,
        user_id: newUser.user.id,
        is_read: false,
        metadata: {
          username: username.trim(),
          email: email.trim().toLowerCase(),
          action: 'registration',
        },
      });

      if (notifError) {
        console.error('[register] notification insert error:', notifError.message);
        // Coba insert tanpa kolom metadata (jika kolom tidak ada)
        const { error: notifError2 } = await supabase.from('notifications').insert({
          type: 'registration',
          title: `Registrasi Baru: ${username.trim()}`,
          message: `User ${username.trim()} (${email.trim().toLowerCase()}) mendaftar dan menunggu persetujuan.`,
          user_id: newUser.user.id,
          is_read: false,
        });
        if (notifError2) {
          console.error('[register] notification insert retry error:', notifError2.message);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Registrasi berhasil!' });
  } catch (err) {
    console.error('[register] unexpected error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
