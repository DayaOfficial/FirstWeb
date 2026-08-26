-- Step 10H: SMM category column + payment_status 'canceled' support

-- 1. Tambah kolom smm_category untuk menyimpan kategori asli dari JokerPanel
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS smm_category TEXT;

-- 2. Pastikan kolom-kolom SMM lain sudah ada (idempoten)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_qty INTEGER DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_qty INTEGER DEFAULT 100000;

-- 3. Perluas CHECK constraint payment_status untuk mendukung 'canceled'
-- Drop constraint lama lalu buat ulang
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'expired', 'failed', 'canceled'));
