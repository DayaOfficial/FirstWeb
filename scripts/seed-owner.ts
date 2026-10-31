import { createClient } from '@supabase/supabase-js';

/**
 * Script seed akun owner DAYA MART
 * Jalankan: npx tsx scripts/seed-owner.ts
 *
 * Pastikan .env.local sudah berisi:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - OWNER_INITIAL_PASSWORD (password awal, ganti segera setelah login)
 */

const OWNER_EMAIL = 'dayamartweb@gmail.com';
const OWNER_USERNAME = 'DayaMart';

async function seedOwner() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ownerPassword = process.env.OWNER_INITIAL_PASSWORD;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env.local');
    process.exit(1);
  }

  if (!ownerPassword) {
    console.error('❌ OWNER_INITIAL_PASSWORD wajib diisi di .env.local (min 6 karakter)');
    process.exit(1);
  }

  // WAJIB service role, bukan anon key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Cek apakah user sudah ada
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === OWNER_EMAIL);

  let userId: string;

  if (found) {
    userId = found.id;
    // Update username jika masih beda
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { username: OWNER_USERNAME, role: 'owner' },
    });
    console.log('ℹ️  Owner sudah ada, username diupdate ke:', OWNER_USERNAME);
  } else {
    // 2. Buat user auth baru
    const { data, error } = await supabase.auth.admin.createUser({
      email: OWNER_EMAIL,
      password: ownerPassword,
      email_confirm: true, // auto-confirm, tidak perlu klik email
      user_metadata: { username: OWNER_USERNAME, role: 'owner' },
    });

    if (error) {
      console.error('❌ Gagal membuat user:', error.message);
      process.exit(1);
    }

    userId = data.user.id;
    console.log('✅ Owner dibuat:', OWNER_EMAIL);
  }

  // 3. Upsert ke tabel profiles dengan role owner
  const { error: upsertErr } = await supabase.from('profiles').upsert({
    id: userId,
    email: OWNER_EMAIL,
    username: OWNER_USERNAME,
    role: 'owner',
    status: 'approved',
    approved_at: new Date().toISOString(),
  });

  if (upsertErr) {
    console.error('❌ Gagal upsert profil:', upsertErr.message);
    process.exit(1);
  }

  console.log('');
  console.log('✅ Owner siap!');
  console.log('   Email   :', OWNER_EMAIL);
  console.log('   Username:', OWNER_USERNAME);
  console.log('   Role    : owner');
  console.log('');
  console.log('   Login di /login lalu buka /panel/x7k9m2-daya-owner');
  console.log('');
  console.log('⚠️  PENTING: Segera ganti password awal dari Panel Owner → Pengaturan');
}

seedOwner().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
