-- 006: Fix Nokos RLS policies so owner can read/write apps and countries
-- Also add sort_order column if missing, and ensure description column exists

-- ── nokos_apps: disable RLS entirely (small table, owner-managed) ──
ALTER TABLE IF EXISTS nokos_apps DISABLE ROW LEVEL SECURITY;

-- ── nokos_countries: disable RLS entirely ──
ALTER TABLE IF EXISTS nokos_countries DISABLE ROW LEVEL SECURITY;

-- ── Ensure columns exist (may be missing from earlier migrations) ──
ALTER TABLE nokos_apps ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE nokos_apps ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE nokos_countries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE nokos_countries ADD COLUMN IF NOT EXISTS flag_image_url TEXT;

-- ── Drop existing policies if any (they can block even with RLS disabled in some configs) ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "baca_apps" ON nokos_apps;
  DROP POLICY IF EXISTS "baca_neg" ON nokos_countries;
  DROP POLICY IF EXISTS "owner_tulis_apps" ON nokos_apps;
  DROP POLICY IF EXISTS "owner_tulis_neg" ON nokos_countries;
  DROP POLICY IF EXISTS "Enable read access for all users" ON nokos_apps;
  DROP POLICY IF EXISTS "Enable read access for all users" ON nokos_countries;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON nokos_apps;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON nokos_countries;
  DROP POLICY IF EXISTS "Enable update for authenticated users only" ON nokos_apps;
  DROP POLICY IF EXISTS "Enable update for authenticated users only" ON nokos_countries;
  DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON nokos_apps;
  DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON nokos_countries;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── Also fix faqs table RLS ──
ALTER TABLE IF EXISTS faqs DISABLE ROW LEVEL SECURITY;
