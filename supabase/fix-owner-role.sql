-- ============================================
-- JALANKAN DI SUPABASE SQL EDITOR
-- https://supabase.com/dashboard → SQL Editor
-- ============================================

-- 1. CEK: apakah user sudah ada di profiles?
SELECT p.id, p.username, p.email, p.role, p.status
FROM profiles p
JOIN auth.users a ON a.id = p.id
WHERE a.email = 'dayamartweb@gmail.com';

-- 2. Jika TIDAK ADA baris → INSERT:
INSERT INTO profiles (id, username, email, role, status, created_at, updated_at)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'username', 'DayaMart'),
  email,
  'owner',
  'approved',
  created_at,
  NOW()
FROM auth.users
WHERE email = 'dayamartweb@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'owner',
    status = 'approved',
    username = COALESCE(EXCLUDED.username, profiles.username),
    updated_at = NOW();

-- 3. UPDATE auth metadata agar fallback juga benar:
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "owner", "username": "DayaMart"}'::jsonb
WHERE email = 'dayamartweb@gmail.com';

-- 4. VERIFIKASI:
SELECT
  p.id, p.username, p.email, p.role, p.status,
  a.raw_user_meta_data->>'role' AS auth_role
FROM profiles p
JOIN auth.users a ON a.id = p.id
WHERE a.email = 'dayamartweb@gmail.com';
-- HARUS tampil: role = 'owner', status = 'approved', auth_role = 'owner'

-- 5. Pastikan RLS mengizinkan user baca profilenya sendiri:
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'users_read_own_profile'
  ) THEN
    CREATE POLICY "users_read_own_profile" ON profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'users_update_own_profile'
  ) THEN
    CREATE POLICY "users_update_own_profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;
