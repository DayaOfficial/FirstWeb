-- ============================================================
-- DAYA MART — Complete Database Schema
-- Run this in Supabase SQL Editor after creating your project
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase Auth users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'owner')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    'user',
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. PRODUCTS (semua modul: digiflazz, jokerpanel, manual)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),                    -- 'Pulsa', 'Data', 'Game', 'PLN', 'E-Wallet', 'Voucher', dll
  brand VARCHAR(100),                       -- 'TELKOMSEL', 'Free Fire', 'DANA', dll
  module VARCHAR(50) NOT NULL DEFAULT 'digiflazz',  -- 'digiflazz' | 'jokerpanel' | 'manual_nokos' | 'manual_app' | 'manual_robux'
  buyer_sku_code VARCHAR(100),              -- Digiflazz SKU code
  provider_service_id VARCHAR(100),         -- JokerPanel service ID
  price_modal DECIMAL(12,2) DEFAULT 0,      -- Harga modal dari provider
  price_sell DECIMAL(12,2) DEFAULT 0,       -- Harga jual (modal + markup)
  markup_type VARCHAR(10) DEFAULT 'nominal' CHECK (markup_type IN ('nominal', 'percent')),
  markup_value DECIMAL(12,2) DEFAULT 0,
  stock INTEGER DEFAULT -1,                 -- -1 = unlimited (from provider), >=0 = manual stock
  image_url TEXT,                           -- Logo/gambar produk (Supabase Storage URL)
  description TEXT,
  game_name VARCHAR(100),                   -- Nama game (untuk grouping di topup-game)
  currency_label VARCHAR(50),               -- 'Diamonds', 'UC', 'VP', dll
  input_schema JSONB,                       -- Dynamic input fields per game
  requires_region BOOLEAN DEFAULT FALSE,
  manual_confirmation BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  seller_product_status BOOLEAN DEFAULT TRUE,
  unlimited_stock BOOLEAN DEFAULT TRUE,
  multi BOOLEAN DEFAULT TRUE,
  start_cut_off VARCHAR(5),
  end_cut_off VARCHAR(5),
  synced_at TIMESTAMPTZ,                    -- Last sync from provider
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_module ON products(module);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_game_name ON products(game_name);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_buyer_sku_code ON products(buyer_sku_code);

-- ============================================================
-- 3. GAME INPUT TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS game_input_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_key VARCHAR(50) UNIQUE NOT NULL,     -- 'free_fire', 'mobile_legends', etc
  game_name VARCHAR(100) NOT NULL,
  currency_label VARCHAR(50),
  input_schema JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code VARCHAR(30) UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  module VARCHAR(50) NOT NULL,
  product_name VARCHAR(255),                -- Snapshot nama produk saat order
  quantity INTEGER DEFAULT 1,
  amount DECIMAL(12,2) NOT NULL,
  buyer_name VARCHAR(100),
  buyer_phone VARCHAR(20),
  buyer_input TEXT,                          -- customer_no / link / username yang diinput buyer
  
  -- Payment
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'expired', 'failed')),
  payment_method VARCHAR(30) DEFAULT 'qris',
  payment_ref TEXT,                          -- Pakasir reference
  qris_url TEXT,
  paid_at TIMESTAMPTZ,
  
  -- Processing
  process_status VARCHAR(20) DEFAULT 'waiting' CHECK (process_status IN ('waiting', 'processing', 'success', 'pending', 'partial', 'failed', 'canceled', 'refunded')),
  provider_ref TEXT,                         -- Digiflazz ref_id / JokerPanel order ID
  provider_sn TEXT,                          -- Serial number dari Digiflazz
  provider_response JSONB,                   -- Full response from provider
  
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_process_status ON orders(process_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================================
-- 5. NOKOS (Nomor Kosong)
-- ============================================================
CREATE TABLE IF NOT EXISTS nokos_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nokos_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES nokos_apps(id) ON DELETE CASCADE,
  country_code VARCHAR(5) NOT NULL,
  country_name VARCHAR(100) NOT NULL,
  flag_emoji VARCHAR(10),
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nokos_countries_app_id ON nokos_countries(app_id);

-- ============================================================
-- 6. BANNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  image_url TEXT NOT NULL,
  image_mobile_url TEXT,
  link TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. FAQ
-- ============================================================
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'Umum',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. SOCIAL LINKS / CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) NOT NULL,
  logo_url TEXT,
  username VARCHAR(100),
  link TEXT NOT NULL,
  action_label VARCHAR(30) DEFAULT 'Chat',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. SETTINGS (app-wide key-value config)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('store_name', 'DAYA MART'),
  ('store_tagline', 'One Stop Digital Store'),
  ('owner_whatsapp', '087800001232'),
  ('digiflazz_username', ''),
  ('digiflazz_api_key', ''),
  ('digiflazz_testing', 'true'),
  ('jokerpanel_api_key', ''),
  ('jokerpanel_base_url', 'https://jokerpanel.com/api/v2'),
  ('pakasir_merchant_code', ''),
  ('pakasir_api_key', ''),
  ('pakasir_webhook_secret', '')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 10. SYNC LOGS (audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(30) NOT NULL,
  action VARCHAR(50) NOT NULL,
  total_items INTEGER,
  status VARCHAR(20),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Products (public read, owner write)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active products" ON products;
CREATE POLICY "Anyone can read active products"
  ON products FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Owner can manage all products" ON products;
CREATE POLICY "Owner can manage all products"
  ON products FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own orders" ON orders;
CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create orders" ON orders;
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Owner can read all orders" ON orders;
CREATE POLICY "Owner can read all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

DROP POLICY IF EXISTS "Owner can update all orders" ON orders;
CREATE POLICY "Owner can update all orders"
  ON orders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Nokos (public read, owner write)
ALTER TABLE nokos_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE nokos_countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active nokos_apps" ON nokos_apps;
CREATE POLICY "Anyone can read active nokos_apps"
  ON nokos_apps FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Owner can manage nokos_apps" ON nokos_apps;
CREATE POLICY "Owner can manage nokos_apps"
  ON nokos_apps FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Anyone can read active nokos_countries" ON nokos_countries;
CREATE POLICY "Anyone can read active nokos_countries"
  ON nokos_countries FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Owner can manage nokos_countries" ON nokos_countries;
CREATE POLICY "Owner can manage nokos_countries"
  ON nokos_countries FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- Banners, FAQs, Social Links (public read, owner write)
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active banners" ON banners;
CREATE POLICY "Anyone can read active banners" ON banners FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Owner can manage banners" ON banners;
CREATE POLICY "Owner can manage banners" ON banners FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Anyone can read active faqs" ON faqs;
CREATE POLICY "Anyone can read active faqs" ON faqs FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Owner can manage faqs" ON faqs;
CREATE POLICY "Owner can manage faqs" ON faqs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Anyone can read active social_links" ON social_links;
CREATE POLICY "Anyone can read active social_links" ON social_links FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Owner can manage social_links" ON social_links;
CREATE POLICY "Owner can manage social_links" ON social_links FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- Settings (owner only)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can manage settings" ON settings;
CREATE POLICY "Owner can manage settings" ON settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- Notifications (owner read, system write via service role)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can read notifications" ON notifications;
CREATE POLICY "Owner can read notifications" ON notifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
DROP POLICY IF EXISTS "Owner can update notifications" ON notifications;
CREATE POLICY "Owner can update notifications" ON notifications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- Sync logs (owner read only)
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can read sync_logs" ON sync_logs;
CREATE POLICY "Owner can read sync_logs" ON sync_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- ============================================================
-- SEED: Game Input Templates
-- ============================================================
INSERT INTO game_input_templates (game_key, game_name, currency_label, input_schema) VALUES

('free_fire', 'Free Fire', 'Diamonds', '{
  "fields": [
    {"key":"player_id","label":"Player ID","type":"number","required":true,
     "placeholder":"Contoh: 123456789","helper":"Lihat di profil, di bawah nickname"}
  ],
  "format_customer_no": "{player_id}",
  "validation": {"player_id": "^\\d{8,12}$"}
}'),

('mobile_legends', 'Mobile Legends', 'Diamonds', '{
  "fields": [
    {"key":"user_id","label":"User ID","type":"number","required":true,
     "placeholder":"Contoh: 123456789","helper":"Ketuk profil, salin ID"},
    {"key":"zone_id","label":"Zone ID","type":"number","required":true,
     "placeholder":"Contoh: 1234","helper":"Angka dalam kurung setelah ID"}
  ],
  "format_customer_no": "{user_id}.{zone_id}",
  "allow_dot": true,
  "validation": {"user_id": "^\\d{8,12}$", "zone_id": "^\\d{3,6}$"}
}'),

('pubg_mobile', 'PUBG Mobile', 'UC', '{
  "fields": [
    {"key":"player_id","label":"Player ID (Character ID)","type":"number","required":true,
     "placeholder":"Contoh: 5123456789","helper":"Profil → Character ID (9-10 digit)"}
  ],
  "format_customer_no": "{player_id}",
  "validation": {"player_id": "^\\d{9,10}$"}
}'),

('genshin_impact', 'Genshin Impact', 'Genesis Crystals', '{
  "fields": [
    {"key":"uid","label":"UID","type":"number","required":true,
     "placeholder":"Contoh: 812345678","helper":"Server Asia: diawali angka 8 (9 digit)"}
  ],
  "format_customer_no": "{uid}",
  "validation": {"uid": "^8\\d{8}$"}
}'),

('honkai_star_rail', 'Honkai: Star Rail', 'Oneiric Shards', '{
  "fields": [
    {"key":"uid","label":"UID","type":"number","required":true,
     "placeholder":"Contoh: 812345678","helper":"9 digit, diawali angka 8"}
  ],
  "format_customer_no": "{uid}",
  "validation": {"uid": "^8\\d{8}$"}
}'),

('valorant', 'Valorant', 'Valorant Points', '{
  "fields": [
    {"key":"riot_id","label":"Riot ID","type":"text","required":true,
     "placeholder":"Contoh: BUDIGAMING","helper":"Nama Riot ID Anda"},
    {"key":"riot_tag","label":"Tagline","type":"text","required":true,
     "placeholder":"Contoh: 1234","helper":"Kode setelah tanda #"},
    {"key":"region","label":"Region","type":"select","required":true,
     "options":["AP (Asia Pacific)","KR (Korea)","NA (North America)","EU (Europe)"]}
  ],
  "format_customer_no": "{riot_id}#{riot_tag}",
  "requires_region": true
}'),

('roblox', 'Roblox', 'Robux', '{
  "fields": [
    {"key":"username","label":"Username Roblox","type":"text","required":true,
     "placeholder":"Contoh: budi_gaming123","helper":"Username login, bukan display name"}
  ],
  "format_customer_no": "{username}"
}'),

('higgs_domino', 'Higgs Domino Island', 'Chip', '{
  "fields": [
    {"key":"player_id","label":"Player ID","type":"number","required":true,
     "placeholder":"Contoh: 123456789","helper":"ID di profil game"}
  ],
  "format_customer_no": "{player_id}",
  "validation": {"player_id": "^\\d{8,12}$"}
}'),

('steam_wallet', 'Steam Wallet IDR', 'Saldo', '{
  "fields": [
    {"key":"email","label":"Email Akun Steam","type":"email","required":true,
     "placeholder":"Contoh: budi@email.com","helper":"Email yang terdaftar di Steam"}
  ],
  "format_customer_no": "{email}"
}')

ON CONFLICT (game_key) DO NOTHING;

-- ============================================================
-- SEED: Owner Account Setup
-- ============================================================
-- Buat profil owner langsung (jika belum dibuat oleh trigger).
-- ID ini harus cocok dengan user yang sudah dibuat di Supabase Auth → Authentication → Users.
INSERT INTO profiles (id, username, email, role, status, approved_at, created_at)
VALUES (
  '6b46d2d3-491c-43f5-84e8-78195a26b005',
  'dayamart',
  'dayamartweb@gmail.com',
  'owner',
  'approved',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'owner',
  status = 'approved',
  approved_at = NOW();
