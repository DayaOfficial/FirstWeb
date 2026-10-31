-- ============================================================
-- 005: Seed FAQs, Social Links & Profit Rules
-- ============================================================

-- Seed FAQ default (jika tabel kosong)
INSERT INTO faqs (id, question, answer, category, sort_order, is_active) VALUES
  (gen_random_uuid(), 'Bagaimana cara melakukan pemesanan di DAYA MART?', 'Pilih produk yang diinginkan → Isi data yang diperlukan (User ID, No. HP, dll) → Lakukan pembayaran via QRIS → Pesanan akan diproses otomatis dalam hitungan detik.', 'Umum', 0, true),
  (gen_random_uuid(), 'Metode pembayaran apa saja yang tersedia?', 'Saat ini kami hanya menerima pembayaran melalui QRIS. Anda bisa scan QRIS menggunakan e-wallet (DANA, OVO, GoPay, ShopeePay) atau m-banking apapun.', 'Pembayaran', 1, true),
  (gen_random_uuid(), 'Berapa lama proses pengiriman pesanan?', 'Untuk produk digital otomatis (Top Up Game, Pulsa, Token), proses hanya 1-30 detik setelah pembayaran terverifikasi. Untuk produk manual (Nokos, Robux Vilog, App Premium), proses 1-24 jam di jam operasional.', 'Umum', 2, true),
  (gen_random_uuid(), 'Apakah transaksi di DAYA MART aman?', 'Ya! Kami menggunakan payment gateway resmi dan semua data pelanggan dienkripsi. Kami juga 100% amanah — jika pesanan gagal, uang Anda akan dikembalikan.', 'Umum', 3, true),
  (gen_random_uuid(), 'Bagaimana jika pesanan saya gagal?', 'Jika pesanan gagal diproses, silakan hubungi kami via WhatsApp dengan menyertakan Order ID. Kami akan segera membantu menyelesaikan masalah Anda.', 'Pembayaran', 4, true),
  (gen_random_uuid(), 'Apa itu Nokos?', 'Nokos (Nomor Kosong) adalah nomor HP yang sudah terdaftar di aplikasi tertentu. Berguna untuk keperluan registrasi atau verifikasi akun tanpa menggunakan nomor pribadi Anda.', 'Nokos', 5, true),
  (gen_random_uuid(), 'Bagaimana cara membeli Nokos?', 'Pilih aplikasi yang diinginkan → Pilih negara → Konfirmasi → Bayar via QRIS → Salin format pesan → Kirim ke WhatsApp owner.', 'Nokos', 6, true),
  (gen_random_uuid(), 'Jam operasional DAYA MART?', 'Untuk produk otomatis, layanan tersedia 24/7. Untuk produk manual dan customer service, jam operasional adalah 08:00 - 22:00 WIB setiap hari.', 'Umum', 7, true),
  (gen_random_uuid(), 'Bagaimana cara menghubungi customer service?', 'Anda bisa menghubungi kami melalui WhatsApp di nomor yang tertera di website, atau melalui fitur Chat WhatsApp di sidebar.', 'Umum', 8, true)
ON CONFLICT DO NOTHING;

-- Seed Social Links default (jika tabel kosong)
INSERT INTO social_links (id, platform, username, link, action_label, sort_order, is_active) VALUES
  (gen_random_uuid(), 'WhatsApp', '0878-0000-1232', 'https://wa.me/6287800001232', 'Chat', 0, true),
  (gen_random_uuid(), 'Telegram', '@dayamart', 'https://t.me/dayamart', 'Chat', 1, true),
  (gen_random_uuid(), 'Instagram', '@dayamart', 'https://instagram.com/dayamart', 'Follow', 2, true)
ON CONFLICT DO NOTHING;

-- Profit rules table
CREATE TABLE IF NOT EXISTS profit_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope VARCHAR(20) NOT NULL CHECK (scope IN ('global', 'game', 'platform', 'operator', 'biller')),
  scope_value VARCHAR(100),
  markup_type VARCHAR(10) DEFAULT 'nominal' CHECK (markup_type IN ('nominal', 'percent')),
  markup_value DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scope, scope_value)
);

-- Default global profit
INSERT INTO profit_rules (scope, scope_value, markup_type, markup_value) VALUES
  ('global', '*', 'percent', 10)
ON CONFLICT (scope, scope_value) DO NOTHING;

-- RLS for profit_rules
ALTER TABLE profit_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can manage profit_rules" ON profit_rules;
CREATE POLICY "Owner can manage profit_rules" ON profit_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner'));

DROP POLICY IF EXISTS "Anyone can read profit_rules" ON profit_rules;
CREATE POLICY "Anyone can read profit_rules" ON profit_rules FOR SELECT USING (true);

-- Add price_sell_locked column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_sell_locked BOOLEAN DEFAULT FALSE;

-- Add flag_image_url to nokos_countries
ALTER TABLE nokos_countries ADD COLUMN IF NOT EXISTS flag_image_url TEXT;
