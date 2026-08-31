-- Step 10J: Perluas constraint payment_status untuk set lengkap
-- Jalankan di Supabase SQL Editor jika migrasi otomatis tidak dipakai

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'completed', 'expired', 'failed', 'canceled', 'refunded'));
