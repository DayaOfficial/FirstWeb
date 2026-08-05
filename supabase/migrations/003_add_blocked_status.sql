-- Migration: Tambah status 'blocked' ke CHECK constraint profiles
-- Jalankan di Supabase SQL Editor

-- 1. Drop constraint lama
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- 2. Tambah constraint baru dengan 'blocked'
ALTER TABLE profiles ADD CONSTRAINT profiles_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'blocked'));

-- 3. Verifikasi
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass AND contype = 'c';
