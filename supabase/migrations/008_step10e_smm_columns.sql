-- Step 10E: Add SMM-specific columns to products table
-- These columns store JokerPanel service metadata for min/max quantity and type

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_qty integer DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_qty integer DEFAULT 100000;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS service_type text;
