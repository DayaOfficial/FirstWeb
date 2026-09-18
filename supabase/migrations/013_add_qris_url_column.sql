-- Pastikan kolom qris_url ada di tabel orders
-- Kolom ini digunakan untuk menyimpan QR string dari Pakasir
-- agar user bisa melanjutkan pembayaran jika keluar dari halaman
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qris_url TEXT;
