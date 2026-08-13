-- ============================================================
-- STEP 10 Migration: product_plans + additional game templates
-- ============================================================

-- 1. Product Plans (for App Premium)
CREATE TABLE IF NOT EXISTS product_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  plan_name VARCHAR(50) NOT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_plans_product_id ON product_plans(product_id);

-- RLS for product_plans
ALTER TABLE product_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active product_plans" ON product_plans;
CREATE POLICY "Anyone can read active product_plans"
  ON product_plans FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Owner can manage product_plans" ON product_plans;
CREATE POLICY "Owner can manage product_plans"
  ON product_plans FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- 2. Additional game input templates (expand coverage)
INSERT INTO game_input_templates (game_key, game_name, currency_label, input_schema) VALUES
('codm', 'Call of Duty Mobile', 'CP', '{"fields":[{"key":"player_id","label":"Player UID","type":"number","required":true,"placeholder":"Contoh: 6789012345"}],"format_customer_no":"{player_id}","allow_dot":false}'),
('efootball', 'eFootball', 'Coins', '{"fields":[{"key":"user_id","label":"User ID","type":"text","required":true,"placeholder":"Masukkan User ID"}],"format_customer_no":"{user_id}","allow_dot":false}'),
('arena_of_valor', 'Arena of Valor', 'Vouchers', '{"fields":[{"key":"player_id","label":"Player ID","type":"number","required":true,"placeholder":"Masukkan Player ID"}],"format_customer_no":"{player_id}","allow_dot":false}'),
('undawn', 'Undawn', 'RC', '{"fields":[{"key":"player_id","label":"Player ID","type":"number","required":true},{"key":"server","label":"Server","type":"text","required":true}],"format_customer_no":"{player_id}","allow_dot":false}'),
('dream_league', 'Dream League Soccer', 'Coins', '{"fields":[{"key":"player_id","label":"Player ID","type":"text","required":true}],"format_customer_no":"{player_id}","allow_dot":false}'),
('clash_of_clans', 'Clash of Clans', 'Gems', '{"fields":[{"key":"player_tag","label":"Player Tag","type":"text","required":true,"placeholder":"Contoh: ABC123XY"}],"format_customer_no":"#{player_tag}","allow_dot":false}'),
('wild_rift', 'LoL: Wild Rift', 'Wild Cores', '{"fields":[{"key":"player_id","label":"Player ID","type":"number","required":true}],"format_customer_no":"{player_id}","allow_dot":false}')
ON CONFLICT (game_key) DO NOTHING;
