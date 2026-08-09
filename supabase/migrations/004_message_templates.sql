-- ============================================================
-- 004: Message Templates for Format Pesan feature
-- ============================================================
-- SAFE: bisa dijalankan berkali-kali tanpa error

-- Fix policy lama di tabel lain yang sering konflik
DROP POLICY IF EXISTS "Anyone can insert notifications" ON notifications;

-- Buat tabel message_templates
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key VARCHAR(50) UNIQUE NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  placeholders JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default templates
INSERT INTO message_templates (template_key, template_name, content, placeholders) VALUES
  ('nokos', 'Nokos (Nomor Kosong)', E'Halo {nama}! 👋\n\nPesanan Nokos kamu sudah kami proses ✅\n\n📋 Detail Pesanan:\n- Order ID: {order_id}\n- Aplikasi: {aplikasi}\n- Negara: {negara}\n- Harga: {harga}\n\n📱 Nomor yang kamu terima:\n{nomor}\n\n⚠️ Segera gunakan nomor ini untuk verifikasi.\n\nTerima kasih sudah belanja di DAYA MART! 🙏',
   '["nama", "order_id", "aplikasi", "negara", "harga", "nomor"]'::jsonb),

  ('robux_vilog', 'Robux Via Login', E'Halo {nama}! 👋\n\nPesanan Robux kamu sudah kami proses ✅\n\n📋 Detail Pesanan:\n- Order ID: {order_id}\n- Jumlah Robux: {jumlah_robux}\n- Harga: {harga}\n- Status: {status}\n\n🎮 Robux sudah masuk ke akun Roblox kamu.\nSilakan cek saldo Robux di game.\n\nTerima kasih sudah belanja di DAYA MART! 🙏',
   '["nama", "order_id", "jumlah_robux", "harga", "status"]'::jsonb),

  ('app_premium', 'Aplikasi Premium', E'Halo {nama}! 👋\n\nPesanan App Premium kamu sudah kami proses ✅\n\n📋 Detail Pesanan:\n- Order ID: {order_id}\n- Aplikasi: {aplikasi}\n- Plan: {plan}\n- Harga: {harga}\n\n🔑 Detail Akun:\nEmail: {email_akun}\nPassword: {password_akun}\n\n⚠️ Jangan ubah password selama masa aktif.\n\nTerima kasih sudah belanja di DAYA MART! 🙏',
   '["nama", "order_id", "aplikasi", "plan", "harga", "email_akun", "password_akun"]'::jsonb)
ON CONFLICT (template_key) DO NOTHING;

-- RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can read message_templates" ON message_templates;
CREATE POLICY "Owner can read message_templates" ON message_templates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner can update message_templates" ON message_templates;
CREATE POLICY "Owner can update message_templates" ON message_templates
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner')
  );

DROP POLICY IF EXISTS "Owner can insert message_templates" ON message_templates;
CREATE POLICY "Owner can insert message_templates" ON message_templates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner')
  );

-- Re-create the notifications insert policy safely
CREATE POLICY "Anyone can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);
