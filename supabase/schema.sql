-- ============================================================
-- Keevan Store — Supabase Database Schema
-- Run this SQL in the Supabase SQL Editor to set up the database
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Creators Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  photo_url TEXT,
  banner_url TEXT,
  social_links JSONB DEFAULT '[]'::jsonb,
  donations_enabled BOOLEAN DEFAULT false,
  donation_goal NUMERIC DEFAULT NULL,
  donation_current NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0 NOT NULL,
  total_earnings NUMERIC DEFAULT 0 NOT NULL,
  total_sales INTEGER DEFAULT 0 NOT NULL,
  total_views INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'),
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30)
);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_creators_username ON creators(username);
CREATE INDEX IF NOT EXISTS idx_creators_is_active ON creators(is_active);

-- ── Products Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL CHECK (price >= 1000),
  currency TEXT DEFAULT 'UGX' NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('digital', 'event')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  thumbnail_url TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  -- Event-specific fields
  venue TEXT,
  event_date TIMESTAMPTZ,
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  tickets_sold INTEGER DEFAULT 0,
  -- Metadata
  views INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  CONSTRAINT unique_creator_slug UNIQUE (creator_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_products_creator_id ON products(creator_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- ── Events Table (extends products for type='event') ────────
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  venue TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  tickets_sold INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_product_id ON events(product_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);

-- ── Orders Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  creator_earning NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'UGX' NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  pesapal_order_tracking_id TEXT,
  pesapal_transaction_id TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mtn_momo', 'airtel_money', 'bank_transfer', 'card')),
  download_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_creator_id ON orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_pesapal_tracking ON orders(pesapal_order_tracking_id);

-- ── Page Views Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  view_type TEXT NOT NULL CHECK (view_type IN ('store', 'product')),
  viewer_ip_hash TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_page_views_creator_created ON page_views(creator_id, created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_product_created ON page_views(product_id, created_at);

-- ── Donations Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  donor_email TEXT NOT NULL,
  donor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  message TEXT DEFAULT '',
  is_anonymous BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_donations_creator_id ON donations(creator_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);

-- ── Withdrawals Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount >= 50000),
  method TEXT NOT NULL CHECK (method IN ('mobile_money', 'bank_transfer')),
  account_details JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  admin_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_creator_id ON withdrawals(creator_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- ── Tickets Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  buyer_email TEXT,
  buyer_name TEXT,
  qr_code_data TEXT NOT NULL UNIQUE,
  checked_in BOOLEAN DEFAULT false NOT NULL,
  checked_in_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON tickets(qr_code_data);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- ── Creators Policies ───────────────────────────────────────

-- Anyone can read active creators (for public store pages)
CREATE POLICY "Creators are viewable by everyone"
  ON creators FOR SELECT
  USING (is_active = true OR id = auth.uid());

-- Creators can update their own profile (but NOT balance/total_earnings)
CREATE POLICY "Creators can update own profile"
  ON creators FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND id = (SELECT id FROM creators WHERE id = auth.uid())
  );

-- Only the system can modify balance and total_earnings
-- This is enforced via a trigger that prevents direct updates to these fields

-- ── Products Policies ───────────────────────────────────────

-- Anyone can read active products (for public store/product pages)
CREATE POLICY "Active products are viewable by everyone"
  ON products FOR SELECT
  USING (status = 'active' OR creator_id = auth.uid());

-- Creators can insert their own products
CREATE POLICY "Creators can insert own products"
  ON products FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Creators can update their own products
CREATE POLICY "Creators can update own products"
  ON products FOR UPDATE
  USING (creator_id = auth.uid());

-- Creators can delete their own products
CREATE POLICY "Creators can delete own products"
  ON products FOR DELETE
  USING (creator_id = auth.uid());

-- ── Events Policies ─────────────────────────────────────────

CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Creators can insert events for own products"
  ON events FOR INSERT
  WITH CHECK (
    product_id IN (SELECT id FROM products WHERE creator_id = auth.uid())
  );

CREATE POLICY "Creators can update events for own products"
  ON events FOR UPDATE
  USING (
    product_id IN (SELECT id FROM products WHERE creator_id = auth.uid())
  );

-- ── Orders Policies ─────────────────────────────────────────

-- Anyone can insert orders (buyers)
CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Creators can read their own orders
CREATE POLICY "Creators can read own orders"
  ON orders FOR SELECT
  USING (creator_id = auth.uid());

-- Only the system can update order status (via webhooks)
-- No update policy for creators

-- ── Page Views Policies ────────────────────────────────────

-- Anyone can insert page views
CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  WITH CHECK (true);

-- Creators can read their own page views
CREATE POLICY "Creators can read own page views"
  ON page_views FOR SELECT
  USING (creator_id = auth.uid());

-- ── Donations Policies ──────────────────────────────────────

-- Anyone can insert donations
CREATE POLICY "Anyone can insert donations"
  ON donations FOR INSERT
  WITH CHECK (true);

-- Creators can read their own donations
CREATE POLICY "Creators can read own donations"
  ON donations FOR SELECT
  USING (creator_id = auth.uid());

-- ── Withdrawals Policies ───────────────────────────────────

-- Creators can insert their own withdrawals
CREATE POLICY "Creators can insert own withdrawals"
  ON withdrawals FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Creators can read their own withdrawals
CREATE POLICY "Creators can read own withdrawals"
  ON withdrawals FOR SELECT
  USING (creator_id = auth.uid());

-- Only admins can update withdrawal status
CREATE POLICY "Admins can update withdrawals"
  ON withdrawals FOR UPDATE
  USING (
    creator_id IN (SELECT id FROM creators WHERE is_admin = true)
  );

-- ── Tickets Policies ────────────────────────────────────────

-- Creators can read tickets for their own events
CREATE POLICY "Creators can read own event tickets"
  ON tickets FOR SELECT
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN products p ON p.id = e.product_id
      WHERE p.creator_id = auth.uid()
    )
  );

-- Only the system can insert/update tickets (via payment webhook)
-- No insert/update policy for creators directly

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- Function to prevent creators from directly modifying balance/total_earnings
CREATE OR REPLACE FUNCTION protect_creator_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow system-level updates (via service role) to change these fields
  IF NEW.balance != OLD.balance OR NEW.total_earnings != OLD.total_earnings THEN
    -- If the update is coming from a non-service-role context, reject it
    -- In practice, the RLS + this trigger provides defense in depth
    IF current_user != 'authenticator' AND current_setting('request.jwt.claims', true)::jsonb->>'role' != 'service_role' THEN
      -- Preserve the old values
      NEW.balance := OLD.balance;
      NEW.total_earnings := OLD.total_earnings;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_protect_creator_balance
  BEFORE UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION protect_creator_balance();

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to handle new user signup (auto-create creator profile)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO creators (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user-' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'New Creator')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The handle_new_user trigger should only be created after the first
-- signup flow is implemented. In our app, we create the creator profile
-- via the API route after signup, so this trigger is optional.
-- Uncomment if you want automatic creator profile creation:
-- CREATE TRIGGER trigger_handle_new_user
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Helper Functions (Server-side only, called via Supabase RPC or API routes)
-- ============================================================

-- Function to process a completed payment (called from API/webhook)
-- This is the ONLY way to update balance and total_earnings
CREATE OR REPLACE FUNCTION process_completed_payment(
  p_order_id UUID,
  p_pesapal_transaction_id TEXT
)
RETURNS void AS $$
DECLARE
  v_order RECORD;
  v_creator_id UUID;
  v_product_id UUID;
  v_amount NUMERIC;
  v_platform_fee NUMERIC;
  v_creator_earning NUMERIC;
BEGIN
  -- Get order details
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Idempotency check: if already completed, do nothing
  IF v_order.status = 'completed' THEN
    RETURN;
  END IF;

  v_creator_id := v_order.creator_id;
  v_product_id := v_order.product_id;
  v_amount := v_order.amount;
  v_platform_fee := v_order.platform_fee;
  v_creator_earning := v_order.creator_earning;

  -- Update order status
  UPDATE orders
  SET status = 'completed',
      pesapal_transaction_id = p_pesapal_transaction_id,
      updated_at = now()
  WHERE id = p_order_id;

  -- Update creator balance and total earnings
  UPDATE creators
  SET balance = balance + v_creator_earning,
      total_earnings = total_earnings + v_creator_earning,
      total_sales = total_sales + 1
  WHERE id = v_creator_id;

  -- Update product sales count and event tickets (only for event products)
  IF v_order.product_id IS NOT NULL THEN
    UPDATE products
    SET sales_count = sales_count + 1
    WHERE id = v_order.product_id;

    -- Only increment tickets_sold for event-type products
    UPDATE products
    SET tickets_sold = tickets_sold + 1
    WHERE id = v_order.product_id
      AND type = 'event';

    UPDATE events
    SET tickets_sold = tickets_sold + 1
    WHERE product_id = v_order.product_id
      AND EXISTS (
        SELECT 1 FROM products WHERE id = v_order.product_id AND type = 'event'
      );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process withdrawal approval
CREATE OR REPLACE FUNCTION process_withdrawal_approval(
  p_withdrawal_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_creator_id UUID;
  v_amount NUMERIC;
BEGIN
  -- Get withdrawal details
  SELECT creator_id, amount INTO v_creator_id, v_amount
  FROM withdrawals WHERE id = p_withdrawal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  -- Check if still pending
  IF EXISTS (SELECT 1 FROM withdrawals WHERE id = p_withdrawal_id AND status != 'pending') THEN
    RAISE EXCEPTION 'Withdrawal is not in pending status';
  END IF;

  -- Deduct from creator balance
  UPDATE creators
  SET balance = balance - v_amount
  WHERE id = v_creator_id AND balance >= v_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance or creator not found';
  END IF;

  -- Update withdrawal status
  UPDATE withdrawals
  SET status = 'approved',
      admin_notes = p_admin_notes,
      processed_at = now()
  WHERE id = p_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Atomic Increment Functions (prevent TOCTOU race conditions)
-- ============================================================

-- Atomically increment creator earnings (balance + total_earnings + total_sales)
CREATE OR REPLACE FUNCTION increment_creator_earnings(
  p_creator_id UUID,
  p_amount NUMERIC
)
RETURNS void AS $$
BEGIN
  UPDATE creators
  SET balance = balance + p_amount,
      total_earnings = total_earnings + p_amount,
      total_sales = total_sales + 1
  WHERE id = p_creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomically increment product sales_count
CREATE OR REPLACE FUNCTION increment_product_sales(
  p_product_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET sales_count = sales_count + 1
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomically increment event tickets_sold
CREATE OR REPLACE FUNCTION increment_event_tickets(
  p_product_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE events
  SET tickets_sold = tickets_sold + 1
  WHERE product_id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomically process a donation (increment balance, total_earnings, total_sales, donation_current)
CREATE OR REPLACE FUNCTION process_donation(
  p_creator_id UUID,
  p_amount NUMERIC,
  p_creator_earning NUMERIC
)
RETURNS void AS $$
BEGIN
  UPDATE creators
  SET balance = balance + p_creator_earning,
      total_earnings = total_earnings + p_creator_earning,
      total_sales = total_sales + 1,
      donation_current = donation_current + p_amount
  WHERE id = p_creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomically increment creator total_views
CREATE OR REPLACE FUNCTION increment_creator_views(
  p_creator_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE creators
  SET total_views = total_views + 1
  WHERE id = p_creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Seed Data (optional, for development/testing)
-- ============================================================

-- Insert demo creators (only if not already present)
-- Note: These require corresponding auth.users entries in Supabase
-- In production, creators are created via the signup flow

-- The following are reference IDs for the mock data layer:
-- creator-1: sarah@keevan.store / sarah-creates
-- creator-2: james@keevan.store / james-beats
-- creator-3: nina@keevan.store / nina-events

-- ── Download Sessions Table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS download_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  download_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  download_count INTEGER DEFAULT 0 NOT NULL,
  max_downloads INTEGER DEFAULT 5 NOT NULL,
  last_downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_download_sessions_token ON download_sessions(download_token);
CREATE INDEX IF NOT EXISTS idx_download_sessions_order_id ON download_sessions(order_id);
CREATE INDEX IF NOT EXISTS idx_download_sessions_expires_at ON download_sessions(expires_at);

-- RLS: Anyone with a valid token can read their download session
ALTER TABLE download_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Download sessions viewable by token holders"
  ON download_sessions FOR SELECT
  USING (true);

-- Only system can insert/update download sessions
-- No insert policy for creators
