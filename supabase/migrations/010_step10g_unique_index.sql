-- Step 10G: Unique index on provider_code + dedup + game templates update

-- 1. Bersihkan duplikat provider_code (simpan yang paling lama/id terkecil)
DELETE FROM public.products a
USING public.products b
WHERE a.id > b.id
  AND a.provider_code = b.provider_code
  AND a.provider_code IS NOT NULL;

-- 2. Index unik agar batch upsert aman
CREATE UNIQUE INDEX IF NOT EXISTS products_provider_code_key
  ON public.products (provider_code)
  WHERE provider_code IS NOT NULL;

-- 3. Update game templates (ON CONFLICT DO UPDATE agar data terbaru)
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
