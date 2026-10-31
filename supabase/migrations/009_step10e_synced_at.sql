-- Step 10E: Add synced_at timestamp to products table
-- Tracks when each product was last synced from the provider

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS synced_at timestamptz;
