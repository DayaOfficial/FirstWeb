-- ============================================================
-- DAYA MART — SKRIP DATABASE LENGKAP (FULL REBUILD)
-- ============================================================
-- Jalankan SEKALI di Supabase SQL Editor.
-- Skrip ini idempoten (aman dijalankan berulang kali).
-- Dikonsolidasi dari migration 001-010 + step-10b + fix-owner.
-- ============================================================

-- ┌──────────────────────────────────────────────────────────────┐
-- │  BAGIAN 1: EXTENSIONS                                        │
-- └──────────────────────────────────────────────────────────────┘

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ┌──────────────────────────────────────────────────────────────┐
-- │  BAGIAN 2: FUNGSI is_owner() — ANTI INFINITE RECURSION       │
-- │  Baca dari auth.users metadata, BUKAN dari profiles          │
-- └──────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.is_owner() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'owner'
  );
$$;

-- ┌──────────────────────────────────────────────────────────────┐
-- │  BAGIAN 3: TABEL — PROFILES                                  │
-- └──────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  avatar_url TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint status: pending, approved, rejected, blocked
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'blocked', 'active'));

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

-- ┌──────────────────────────────────────────────────────────────┐
-- │  BAGIAN 4: TABEL — SETTINGS                                  │
-- └──────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
  ('store_name', 'DAYA MART'),
  ('store_tagline', 'One Stop Digital Store'),
  ('owner_whatsapp', '087800001232'),
  ('digiflazz_username', ''),
  ('digiflazz_api_key', ''),
  ('digiflazz_testing', 'true'),
  ('jokerpanel_api_id', ''),
  ('jokerpanel_api_key', ''),
  ('jokerpanel_base_url', 'https://jokerpanel.com/api/v2'),
  ('pakasir_merchant_code', ''),
  ('pakasir_api_key', ''),
  ('pakasir_webhook_secret', ''),
  ('digiflazz_min_balance', '100000'),
  ('jokerpanel_min_balance', '50')
ON CONFLICT (key) DO NOTHING;

-- ┌──────────────────────────────────────────────────────────────┐
-- │  BAGIAN 5: TABEL — PRODUCTS                                  │
-- │  Kolom provider_code = buyer_sku_code Digiflazz              │
-- │         provider_code = service ID JokerPanel                │
-- └──────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL DEFAULT 'digiflazz',
  category TEXT,
  brand TEXT,
  name TEXT NOT NULL,
  provider_code TEXT,
  price_modal NUMERIC DEFAULT 0,
  price_sell NUMERIC DEFAULT 0,
  profit_type TEXT DEFAULT 'fixed',
  profit_value NUMERIC DEFAULT 0,
  markup_type TEXT DEFAULT 'nominal',
  markup_value NUMERIC DEFAULT 0,
  price_sell_locked BOOLEAN DEFAULT FALSE,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  game_key TEXT,
  game_slug TEXT,
  game_name TEXT,
  currency_label TEXT,
  description TEXT,
  service_type TEXT,
  min_qty INTEGER DEFAULT 10,
  max_qty INTEGER DEFAULT 100000,
  is_active BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tambah kolom jika belum ada (idempoten)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS profit_type TEXT DEFAULT 'fixed';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS profit_value NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS markup_type TEXT DEFAULT 'nominal';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS markup_value NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_sell_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS game_key TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS game_slug TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS game_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency_label TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS provider_code TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_qty INTEGER DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_qty INTEGER DEFAULT 100000;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_module ON products(module);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_game_name ON products(game_name);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_provider_code ON products(provider_code);

-- Bersihkan duplikat provider_code sebelum buat unique index
DELETE FROM public.products a USING public.products b
WHERE a.id > b.id AND a.provider_code = b.provider_code AND a.provider_code IS NOT NULL;

-- Unique index agar batch upsert/insert aman
CREATE UNIQUE INDEX IF NOT EXISTS products_provider_code_key
  ON public.products (provider_code)
  WHERE provider_code IS NOT NULL;

-- ┌──────────────────────────────────────────────────────────────┐
-- │  BAGIAN 6: TABEL — PRODUCT_PLANS (untuk App Premium)         │
-- └──────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.product_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_plans_product_id ON product_plans(product_id);

-- ┌──────────────────────────────────────────────────────────────┐
-- │  BAGIAN 7: TABEL — GAME_INPUT_TEMPLATES                      │
-- └──────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.game_input_templates (
  game_key TEXT PRIMARY KEY,
  game_name TEXT,
  currency_label TEXT,
  input_schema JSONB
);

-- ┌──────────────────────────────────────────────────────────────┐
-- │  BAGIAN 8: TABEL — ORDERS                                    │
-- └──────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT UNIQUE,
  user_id UUID,
  product_id UUID,
  module TEXT,
  product_name TEXT,
  name TEXT,
  quantity INTEGER DEFAULT 1,
  amount NUMERIC DEFAULT 0,
  target_input TEXT,
  buyer_input TEXT,
  buyer_name TEXT,
  buyer_phone TEXT,

  -- Payment
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'qris',
  payment_ref TEXT,
  qris_url TEXT,
  paid_at TIMESTAMPTZ,

  -- Processing
  process_status TEXT DEFAULT 'waiting',
  provider_ref TEXT,
  provider_sn TEXT,
  serial_number TEXT,
  provider_response JSONB,
  format_copied BOOLEAN DEFAULT FALSE,
  meta JSONB,

  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tambah kolom jika belum ada
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_input TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'qris';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_ref TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qris_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS process_status TEXT DEFAULT 'waiting';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider_ref TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider_sn TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider_response JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS format_copied BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS meta JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_process_status ON orders(process_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ┌──────────────────────────────────────────────────────────────┐
-- │  BAGIAN 9: TABEL — NOKOS (Nomor Kosong)                      │
-- └──────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.nokos_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nokos_apps ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE nokos_apps ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.nokos_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.nokos_apps(id) ON DELETE CASCADE,
  country_code TEXT,
  country_name TEXT NOT NULL,
  flag_emoji TEXT,
  flag_url TEXT,
  flag_image_url TEXT,
  price NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nokos_countries ADD COLUMN IF NOT EXISTS flag_image_url TEXT;
ALTER TABLE nokos_countries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE nokos_countries ADD COLUMN IF NOT EXISTS flag_url TEXT;

CREATE INDEX IF NOT EXISTS idx_nokos_countries_app_id ON nokos_countries(app_id);

-- ┌──────────────────────────────────────────────────────────────┐
-- │  BAGIAN 10: TABEL — BANNERS, FAQS, SOCIAL_LINKS              │
-- └──────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  image_url TEXT,
  image_mobile_url TEXT,
  link TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  focal TEXT DEFAULT 'center',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'Umum',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  logo_url TEXT,
  username TEXT,
  link TEXT NOT NULL,
  action_label TEXT DEFAULT 'Chat',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ┌──────────────────────────────────────────────────────────────┐
-- │  BAGIAN 11: TABEL — MESSAGE_TEMPLATES                        │
-- └──────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  template_name TEXT NOT NULL,
  content TEXT NOT NULL,
  placeholders JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed message templates
INSERT INTO message_templates (template_key, template_name, content, placeholders) VALUES
  ('nokos', 'Nokos (Nomor Kosong)', E'Halo {nama}! \U0001f44b\n\nPesanan Nokos kamu sudah kami proses \u2705\n\n\U0001f4cb Detail Pesanan:\n- Order ID: {order_id}\n- Aplikasi: {aplikasi}\n- Negara: {negara}\n- Harga: {harga}\n\n\U0001f4f1 Nomor yang kamu terima:\n{nomor}\n\n\u26a0\ufe0f Segera gunakan nomor ini untuk verifikasi.\n\nTerima kasih sudah belanja di DAYA MART! \U0001f64f',
   '["nama", "order_id", "aplikasi", "negara", "harga", "nomor"]'::jsonb),
  ('robux_vilog', 'Robux Via Login', E'Halo {nama}! \U0001f44b\n\nPesanan Robux kamu sudah kami proses \u2705\n\n\U0001f4cb Detail Pesanan:\n- Order ID: {order_id}\n- Jumlah Robux: {jumlah_robux}\n- Harga: {harga}\n- Status: {status}\n\n\U0001f3ae Robux sudah masuk ke akun Roblox kamu.\nSilakan cek saldo Robux di game.\n\nTerima kasih sudah belanja di DAYA MART! \U0001f64f',
   '["nama", "order_id", "jumlah_robux", "harga", "status"]'::jsonb),
  ('app_premium', 'Aplikasi Premium', E'Halo {nama}! \U0001f44b\n\nPesanan App Premium kamu sudah kami proses \u2705\n\n\U0001f4cb Detail Pesanan:\n- Order ID: {order_id}\n- Aplikasi: {aplikasi}\n- Plan: {plan}\n- Harga: {harga}\n\n\U0001f511 Detail Akun:\nEmail: {email_akun}\nPassword: {password_akun}\n\n\u26a0\ufe0f Jangan ubah password selama masa aktif.\n\nTerima kasih sudah belanja di DAYA MART! \U0001f64f',
   '["nama", "order_id", "aplikasi", "plan", "harga", "email_akun", "password_akun"]'::jsonb)
ON CONFLICT (template_key) DO NOTHING;

-- ┌──────────────────────────────────────────────────────────────┐
-- │  BAGIAN 12: TABEL — NOTIFICATIONS                            │
-- └──────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'registration',
  title TEXT NOT NULL,
  message TEXT,
  user_id UUID,
  username TEXT,
  email TEXT,
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ┌──────────────────────────────────────────────────────────────┐
-- │  BAGIAN 13: TABEL — SYNC_LOGS, PROVIDER_BALANCES             │
-- └──────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT,
  action TEXT,
  total_items INTEGER,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  raw_response JSONB,
  error TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_balances_provider_time
  ON provider_balances (provider, checked_at DESC);

-- ┌──────────────────────────────────────────────────────────────┐
-- │  BAGIAN 14: TABEL — PROFIT_RULES                             │
-- └──────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.profit_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL,
  scope_value TEXT,
  markup_type TEXT DEFAULT 'nominal',
  markup_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scope, scope_value)
);

INSERT INTO profit_rules (scope, scope_value, markup_type, markup_value) VALUES
  ('global', '*', 'percent', 10)
ON CONFLICT (scope, scope_value) DO NOTHING;


-- ============================================================
-- ============================================================
--   ROW LEVEL SECURITY (RLS)
-- ============================================================
-- ============================================================

-- ┌──────────────────────────────────────────────────────────────┐
-- │  PROFILES RLS — Aman tanpa recursion (pakai is_owner)        │
-- └──────────────────────────────────────────────────────────────┘

-- Hapus SEMUA policy lama pada profiles (mencegah konflik)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Semua user login bisa baca profiles
CREATE POLICY profiles_sel ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Insert: hanya untuk diri sendiri (register)
CREATE POLICY profiles_ins ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Update: diri sendiri ATAU owner
CREATE POLICY profiles_upd ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_owner());

-- Delete: hanya owner, tidak bisa hapus diri sendiri
CREATE POLICY profiles_del ON public.profiles
  FOR DELETE TO authenticated USING (public.is_owner() AND id <> auth.uid());

-- ┌──────────────────────────────────────────────────────────────┐
-- │  TABEL NON-PROFILES: BACA=semua login, TULIS=owner           │
-- └──────────────────────────────────────────────────────────────┘

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'settings','products','product_plans','game_input_templates',
    'banners','social_links','message_templates',
    'provider_balances','sync_logs','profit_rules'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS sel_auth ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY sel_auth ON public.%I FOR SELECT TO authenticated USING (true)', t
    );
    EXECUTE format('DROP POLICY IF EXISTS own_write ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY own_write ON public.%I FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner())', t
    );
  END LOOP;
END $$;

-- ┌──────────────────────────────────────────────────────────────┐
-- │  ORDERS RLS                                                  │
-- └──────────────────────────────────────────────────────────────┘

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS orders_sel ON public.orders;
CREATE POLICY orders_sel ON public.orders FOR SELECT TO authenticated
  USING (public.is_owner() OR user_id = auth.uid());
DROP POLICY IF EXISTS orders_ins ON public.orders;
CREATE POLICY orders_ins ON public.orders FOR INSERT TO authenticated
  WITH CHECK (true);
DROP POLICY IF EXISTS orders_upd ON public.orders;
CREATE POLICY orders_upd ON public.orders FOR UPDATE TO authenticated
  USING (public.is_owner() OR user_id = auth.uid());

-- ┌──────────────────────────────────────────────────────────────┐
-- │  NOTIFICATIONS RLS                                           │
-- └──────────────────────────────────────────────────────────────┘

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notif_sel ON public.notifications;
CREATE POLICY notif_sel ON public.notifications FOR SELECT TO authenticated
  USING (public.is_owner());
DROP POLICY IF EXISTS notif_upd ON public.notifications;
CREATE POLICY notif_upd ON public.notifications FOR UPDATE TO authenticated
  USING (public.is_owner());
DROP POLICY IF EXISTS notif_del ON public.notifications;
CREATE POLICY notif_del ON public.notifications FOR DELETE TO authenticated
  USING (public.is_owner());
DROP POLICY IF EXISTS notif_ins ON public.notifications;
CREATE POLICY notif_ins ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- ┌──────────────────────────────────────────────────────────────┐
-- │  NOKOS & FAQS RLS — Disabled (tabel kecil, owner-managed)    │
-- └──────────────────────────────────────────────────────────────┘

ALTER TABLE IF EXISTS nokos_apps DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS nokos_countries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS faqs DISABLE ROW LEVEL SECURITY;


-- ============================================================
-- ============================================================
--   STORAGE BUCKETS
-- ============================================================
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
  VALUES ('brand-logos', 'brand-logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
  VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
  VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS storage_read ON storage.objects;
CREATE POLICY storage_read ON storage.objects FOR SELECT TO public
  USING (bucket_id IN ('brand-logos', 'avatars', 'banners', 'products'));
DROP POLICY IF EXISTS storage_write ON storage.objects;
CREATE POLICY storage_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('brand-logos', 'avatars', 'banners', 'products'));
DROP POLICY IF EXISTS storage_upd ON storage.objects;
CREATE POLICY storage_upd ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('brand-logos', 'avatars', 'banners', 'products'));
DROP POLICY IF EXISTS storage_del ON storage.objects;
CREATE POLICY storage_del ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('brand-logos', 'avatars', 'banners', 'products'));


-- ============================================================
-- ============================================================
--   SEED DATA
-- ============================================================
-- ============================================================

-- ┌──────────────────────────────────────────────────────────────┐
-- │  SEED: GAME INPUT TEMPLATES (13 game)                        │
-- └──────────────────────────────────────────────────────────────┘

INSERT INTO game_input_templates (game_key, game_name, currency_label, input_schema) VALUES
('mobile_legends','Mobile Legends','Diamonds','{"fields":[{"key":"user_id","label":"User ID","type":"number","required":true,"placeholder":"Contoh: 123456789","helper":"Ketuk profil, salin ID"},{"key":"zone_id","label":"Zone ID","type":"number","required":true,"placeholder":"Contoh: 1234","helper":"Angka dalam kurung setelah ID"}],"format_customer_no":"{user_id}.{zone_id}","allow_dot":true}'),
('free_fire','Free Fire','Diamonds','{"fields":[{"key":"player_id","label":"Player ID","type":"number","required":true,"placeholder":"Contoh: 123456789","helper":"Lihat di profil, di bawah nickname"}],"format_customer_no":"{player_id}","allow_dot":false}'),
('pubg_mobile','PUBG Mobile','UC','{"fields":[{"key":"player_id","label":"Character ID","type":"number","required":true,"placeholder":"Contoh: 5123456789","helper":"Profil > Character ID (9-10 digit)"}],"format_customer_no":"{player_id}","allow_dot":false}'),
('genshin_impact','Genshin Impact','Genesis Crystals','{"fields":[{"key":"uid","label":"UID","type":"number","required":true,"placeholder":"Contoh: 812345678","helper":"Server Asia diawali angka 8 (9 digit)"}],"format_customer_no":"{uid}","allow_dot":false}'),
('honkai_star_rail','Honkai: Star Rail','Oneiric Shards','{"fields":[{"key":"uid","label":"UID","type":"number","required":true,"placeholder":"Contoh: 812345678","helper":"9 digit, diawali angka 8"}],"format_customer_no":"{uid}","allow_dot":false}'),
('valorant','Valorant','Valorant Points','{"fields":[{"key":"riot_id","label":"Riot ID","type":"text","required":true,"placeholder":"Contoh: BUDIGAMING"},{"key":"riot_tag","label":"Tagline","type":"text","required":true,"placeholder":"Contoh: 1234","helper":"Kode setelah tanda #"}],"format_customer_no":"{riot_id}#{riot_tag}","allow_dot":false}'),
('roblox','Roblox','Robux','{"fields":[{"key":"username","label":"Username Roblox","type":"text","required":true,"placeholder":"Contoh: budi_gaming123","helper":"Username login, bukan display name"}],"format_customer_no":"{username}","allow_dot":false}'),
('codm','Call of Duty Mobile','CP','{"fields":[{"key":"player_id","label":"Player ID / UID","type":"number","required":true,"placeholder":"Contoh: 6812345678"}],"format_customer_no":"{player_id}","allow_dot":false}'),
('higgs_domino','Higgs Domino','Chip','{"fields":[{"key":"player_id","label":"Player ID","type":"number","required":true,"placeholder":"Contoh: 123456789"}],"format_customer_no":"{player_id}","allow_dot":false}'),
('efootball','eFootball','Coins','{"fields":[{"key":"user_id","label":"User ID","type":"text","required":true,"placeholder":"Masukkan User ID"}],"format_customer_no":"{user_id}","allow_dot":false}'),
('clash_of_clans','Clash of Clans','Gems','{"fields":[{"key":"player_tag","label":"Player Tag","type":"text","required":true,"placeholder":"Contoh: ABC123XY","helper":"Tag dari profil (tanpa #)"}],"format_customer_no":"#{player_tag}","allow_dot":false}'),
('wild_rift','LoL: Wild Rift','Wild Cores','{"fields":[{"key":"player_id","label":"Player ID","type":"number","required":true}],"format_customer_no":"{player_id}","allow_dot":false}'),
('steam_wallet','Steam Wallet','Saldo','{"fields":[{"key":"email","label":"Email Steam","type":"email","required":true,"placeholder":"email@contoh.com","helper":"Email yang terdaftar di akun Steam"}],"format_customer_no":"{email}","allow_dot":false}')
ON CONFLICT (game_key) DO UPDATE SET
  input_schema = EXCLUDED.input_schema,
  game_name = EXCLUDED.game_name,
  currency_label = EXCLUDED.currency_label;

-- ┌──────────────────────────────────────────────────────────────┐
-- │  SEED: FAQ DEFAULT                                           │
-- └──────────────────────────────────────────────────────────────┘

INSERT INTO faqs (id, question, answer, category, sort_order, is_active) VALUES
  (gen_random_uuid(), 'Bagaimana cara melakukan pemesanan di DAYA MART?', 'Pilih produk yang diinginkan, isi data yang diperlukan (User ID, No. HP, dll), lakukan pembayaran via QRIS, dan pesanan akan diproses otomatis dalam hitungan detik.', 'Umum', 0, true),
  (gen_random_uuid(), 'Metode pembayaran apa saja yang tersedia?', 'Saat ini kami menerima pembayaran melalui QRIS. Anda bisa scan QRIS menggunakan e-wallet (DANA, OVO, GoPay, ShopeePay) atau m-banking apapun.', 'Pembayaran', 1, true),
  (gen_random_uuid(), 'Berapa lama proses pengiriman pesanan?', 'Untuk produk digital otomatis (Top Up Game, Pulsa, Token), proses hanya 1-30 detik setelah pembayaran terverifikasi. Untuk produk manual (Nokos, Robux Vilog, App Premium), proses 1-24 jam di jam operasional.', 'Umum', 2, true),
  (gen_random_uuid(), 'Apakah transaksi di DAYA MART aman?', 'Ya! Kami menggunakan payment gateway resmi dan semua data pelanggan dienkripsi. Jika pesanan gagal, uang Anda akan dikembalikan.', 'Umum', 3, true),
  (gen_random_uuid(), 'Bagaimana jika pesanan saya gagal?', 'Jika pesanan gagal diproses, silakan hubungi kami via WhatsApp dengan menyertakan Order ID. Kami akan segera membantu menyelesaikan masalah Anda.', 'Pembayaran', 4, true),
  (gen_random_uuid(), 'Apa itu Nokos?', 'Nokos (Nomor Kosong) adalah nomor HP yang sudah terdaftar di aplikasi tertentu. Berguna untuk keperluan registrasi atau verifikasi akun tanpa menggunakan nomor pribadi Anda.', 'Nokos', 5, true),
  (gen_random_uuid(), 'Jam operasional DAYA MART?', 'Untuk produk otomatis, layanan tersedia 24/7. Untuk produk manual dan customer service, jam operasional adalah 08:00 - 22:00 WIB setiap hari.', 'Umum', 6, true)
ON CONFLICT DO NOTHING;

-- ┌──────────────────────────────────────────────────────────────┐
-- │  SEED: SOCIAL LINKS DEFAULT                                  │
-- └──────────────────────────────────────────────────────────────┘

INSERT INTO social_links (id, platform, username, link, action_label, sort_order, is_active) VALUES
  (gen_random_uuid(), 'WhatsApp', '0878-0000-1232', 'https://wa.me/6287800001232', 'Chat', 0, true),
  (gen_random_uuid(), 'Telegram', '@dayamart', 'https://t.me/dayamart', 'Chat', 1, true),
  (gen_random_uuid(), 'Instagram', '@dayamart', 'https://instagram.com/dayamart', 'Follow', 2, true)
ON CONFLICT DO NOTHING;


-- ============================================================
-- ============================================================
--   SETUP OWNER ACCOUNT
-- ============================================================
-- ============================================================

-- Pastikan owner ada di profiles (dayamartweb@gmail.com)
INSERT INTO public.profiles (id, email, username, role, status, approved_at)
SELECT id, email, 'DayaMart', 'owner', 'approved', NOW()
FROM auth.users
WHERE email = 'dayamartweb@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'owner',
      status = 'approved',
      approved_at = COALESCE(profiles.approved_at, NOW()),
      updated_at = NOW();

-- Pastikan auth metadata juga ada role=owner (ini yang dibaca is_owner)
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "owner", "username": "DayaMart"}'::jsonb
WHERE email = 'dayamartweb@gmail.com';


-- ============================================================
-- SELESAI
-- ============================================================
-- Skrip ini sudah mencakup SELURUH tabel, RLS, storage,
-- seed data, dan setup owner yang dibutuhkan Daya Mart.
--
-- Setelah menjalankan skrip ini:
-- 1. Buka panel owner -> Diagnosa -> Jalankan Pemeriksaan
-- 2. Isi API key di Koneksi & API (Digiflazz, JokerPanel)
-- 3. Sinkronkan produk (Digiflazz & JokerPanel)
-- 4. Aktifkan produk yang ingin dijual
-- ============================================================
