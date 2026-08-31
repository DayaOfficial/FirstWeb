-- Step 10J-fix: Perluas constraint payment_status + tambah kolom platform_icon_url

-- 1. Fix constraint payment_status (agar 'canceled' diterima)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'completed', 'expired', 'failed', 'canceled', 'refunded'));

-- 2. Tambah kolom icon_url di products untuk menyimpan ikon/logo platform SMM
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS platform_icon_url TEXT;
