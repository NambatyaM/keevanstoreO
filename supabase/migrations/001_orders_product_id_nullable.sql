-- ============================================================
-- Migration: Make orders.product_id nullable
-- ============================================================
-- This migration allows orders to exist without a product_id,
-- which is needed for donation-only orders where no product
-- is purchased. The product_id FK reference is preserved,
-- but the column now accepts NULL values.
--
-- Run this SQL in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- Step 1: Make product_id nullable (allows NULL values)
ALTER TABLE orders
  ALTER COLUMN product_id DROP NOT NULL;

-- Step 2: Update the partial index to handle NULL product_ids
-- (The existing index already has a WHERE clause for non-NULL values,
--  so no index change is needed, but let's verify it's correct)
DROP INDEX IF EXISTS idx_orders_product_id;
CREATE INDEX idx_orders_product_id
  ON orders(product_id) WHERE product_id IS NOT NULL;

-- Step 3: Verify the change
-- Run this query separately to confirm:
-- SELECT column_name, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'orders' AND column_name = 'product_id';
