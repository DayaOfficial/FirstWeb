-- ============================================================
-- DAYA MART — Migration 002: Provider Balances
-- Tabel untuk menyimpan riwayat saldo provider (Digiflazz & JokerPanel)
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(30) NOT NULL,          -- 'digiflazz' | 'jokerpanel'
  balance DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'IDR',
  raw_response JSONB,
  error TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_balances_provider_time
  ON provider_balances (provider, checked_at DESC);

-- Threshold peringatan saldo minimum
INSERT INTO settings (key, value) VALUES
  ('digiflazz_min_balance', '100000'),
  ('jokerpanel_min_balance', '50')
ON CONFLICT (key) DO NOTHING;

-- RLS: hanya owner yang boleh baca riwayat saldo
ALTER TABLE provider_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can read provider_balances" ON provider_balances;
CREATE POLICY "Owner can read provider_balances" ON provider_balances FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Owner can manage provider_balances" ON provider_balances;
CREATE POLICY "Owner can manage provider_balances" ON provider_balances FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
