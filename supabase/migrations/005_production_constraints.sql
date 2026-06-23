-- ============================================================
-- Migration: Production-grade database constraints and indexes
-- These constraints prevent data corruption, race conditions, and
-- ensure data integrity under high load and concurrent operations.
-- ============================================================

-- ── Creator Balance Constraint ─────────────────────────────────
-- Prevent negative balances at the database level
ALTER TABLE creators
ADD CONSTRAINT check_balance_non_negative
CHECK (balance >= 0);

-- ── Order Amount Constraints ───────────────────────────────────
-- Ensure order amounts are always positive and reasonable
ALTER TABLE orders
ADD CONSTRAINT check_order_amount_positive
CHECK (amount > 0);

ALTER TABLE orders
ADD CONSTRAINT check_platform_fee_non_negative
CHECK (platform_fee >= 0);

ALTER TABLE orders
ADD CONSTRAINT check_creator_earning_non_negative
CHECK (creator_earning >= 0);

-- ── Donation Amount Constraint ─────────────────────────────────
-- Ensure donation amounts are always positive
ALTER TABLE donations
ADD CONSTRAINT check_donation_amount_positive
CHECK (amount > 0);

-- ── Withdrawal Amount Constraint ───────────────────────────────
-- Ensure withdrawal amounts are always positive
ALTER TABLE withdrawals
ADD CONSTRAINT check_withdrawal_amount_positive
CHECK (amount >= 50000);

-- ── Product Price Constraint ──────────────────────────────────
-- Ensure product prices are reasonable
ALTER TABLE products
ADD CONSTRAINT check_product_price_minimum
CHECK (price >= 1000);

-- ── Event Capacity Constraint ─────────────────────────────────
-- Ensure event capacity is positive if set
ALTER TABLE products
ADD CONSTRAINT check_event_capacity_positive
CHECK (capacity IS NULL OR capacity > 0);

-- ── Tickets Sold Constraint ───────────────────────────────────
-- Ensure tickets sold never exceed capacity
ALTER TABLE products
ADD CONSTRAINT check_tickets_sold_not_exceed_capacity
CHECK (
  type != 'event' OR 
  capacity IS NULL OR 
  tickets_sold <= capacity
);

-- ── Download Session Constraints ────────────────────────────────
-- Ensure download count never exceeds max downloads
ALTER TABLE download_sessions
ADD CONSTRAINT check_download_count_not_exceed_max
CHECK (download_count <= max_downloads);

-- Ensure max_downloads is positive
ALTER TABLE download_sessions
ADD CONSTRAINT check_max_downloads_positive
CHECK (max_downloads > 0);

-- Ensure expires_at is in the future
ALTER TABLE download_sessions
ADD CONSTRAINT check_expires_at_future
CHECK (expires_at > created_at);

-- ── Unique Constraints for Idempotency ─────────────────────────
-- Prevent duplicate orders for the same buyer+product within 60 seconds
-- This is enforced at the application level, but we add a partial index
-- to support efficient queries for idempotency checks
CREATE INDEX IF NOT EXISTS idx_orders_buyer_product_pending
ON orders(buyer_email, product_id, status, created_at)
WHERE status = 'pending';

-- Prevent duplicate withdrawal requests for the same creator+amount within short time
CREATE INDEX IF NOT EXISTS idx_withdrawals_creator_amount_pending
ON withdrawals(creator_id, amount, status, requested_at)
WHERE status = 'pending';

-- ── Foreign Key Constraints with Proper Cascade Rules ───────────
-- Ensure referential integrity with appropriate cascade rules

-- Orders: When a product is deleted, orders should be cascade deleted
-- This is already set in the schema, but let's verify
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_product_id_fkey,
ADD CONSTRAINT orders_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Donations: When an order is deleted, donations should be set to NULL
-- (donations can exist independently for donation-only payments)
ALTER TABLE donations
DROP CONSTRAINT IF EXISTS donations_order_id_fkey,
ADD CONSTRAINT donations_order_id_fkey
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- Download Sessions: When order is deleted, download sessions should cascade
ALTER TABLE download_sessions
DROP CONSTRAINT IF EXISTS download_sessions_order_id_fkey,
ADD CONSTRAINT download_sessions_order_id_fkey
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Download Sessions: When product is deleted, download sessions should cascade
ALTER TABLE download_sessions
DROP CONSTRAINT IF EXISTS download_sessions_product_id_fkey,
ADD CONSTRAINT download_sessions_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Tickets: When order is deleted, tickets should cascade
ALTER TABLE tickets
DROP CONSTRAINT IF EXISTS tickets_order_id_fkey,
ADD CONSTRAINT tickets_order_id_fkey
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Tickets: When event is deleted, tickets should cascade
ALTER TABLE tickets
DROP CONSTRAINT IF EXISTS tickets_event_id_fkey,
ADD CONSTRAINT tickets_event_id_fkey
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Events: When product is deleted, events should cascade
ALTER TABLE events
DROP CONSTRAINT IF EXISTS events_product_id_fkey,
ADD CONSTRAINT events_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- ── Performance Indexes for High-Load Scenarios ─────────────────

-- Index for frequently queried creator data
CREATE INDEX IF NOT EXISTS idx_creators_balance
ON creators(balance)
WHERE balance > 0;

-- Index for order status queries (dashboard, analytics)
CREATE INDEX IF NOT EXISTS idx_orders_status_created
ON orders(status, created_at DESC);

-- Index for product sales queries (analytics, leaderboards)
CREATE INDEX IF NOT EXISTS idx_products_sales_count
ON products(sales_count DESC)
WHERE status = 'active';

-- Index for donation queries (creator dashboards)
CREATE INDEX IF NOT EXISTS idx_donations_creator_created
ON donations(creator_id, created_at DESC);

-- Index for withdrawal status queries (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_withdrawals_status_requested
ON withdrawals(status, requested_at DESC);

-- Index for download session expiration cleanup
CREATE INDEX IF NOT EXISTS idx_download_sessions_expires
ON download_sessions(expires_at)
WHERE expires_at < now();

-- Index for page views analytics
CREATE INDEX IF NOT EXISTS idx_page_views_creator_date
ON page_views(creator_id, created_at DESC);

-- Index for event ticket capacity checks
CREATE INDEX IF NOT EXISTS idx_events_capacity
ON events(product_id, capacity, tickets_sold)
WHERE tickets_sold < capacity;

-- ── Trigger for Download Session Cleanup ─────────────────────────
-- Automatically clean up expired download sessions periodically
CREATE OR REPLACE FUNCTION cleanup_expired_download_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM download_sessions
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Note: This function should be called by a scheduled job (e.g., via pg_cron)
-- For now, it's available for manual cleanup or external scheduling

-- ── Trigger for Ticket Capacity Enforcement ───────────────────────
-- Ensure tickets_sold never exceeds capacity at the database level
CREATE OR REPLACE FUNCTION enforce_event_capacity()
RETURNS trigger AS $$
BEGIN
  IF NEW.tickets_sold > (
    SELECT capacity FROM products WHERE id = NEW.product_id
  ) THEN
    RAISE EXCEPTION 'Tickets sold cannot exceed event capacity';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_event_capacity
BEFORE UPDATE OF tickets_sold ON products
FOR EACH ROW
WHEN (OLD.type = 'event')
EXECUTE FUNCTION enforce_event_capacity();
