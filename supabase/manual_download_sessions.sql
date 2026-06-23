-- ============================================================
-- Manual SQL: Create download_sessions table
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Create the download_sessions table
CREATE TABLE IF NOT EXISTS download_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  download_token TEXT UNIQUE NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  buyer_email TEXT NOT NULL,
  max_downloads INTEGER DEFAULT 3 NOT NULL CHECK (max_downloads > 0),
  download_count INTEGER DEFAULT 0 NOT NULL CHECK (download_count >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  last_downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_download_sessions_token ON download_sessions(download_token);
CREATE INDEX IF NOT EXISTS idx_download_sessions_product_id ON download_sessions(product_id);
CREATE INDEX IF NOT EXISTS idx_download_sessions_order_id ON download_sessions(order_id);
CREATE INDEX IF NOT EXISTS idx_download_sessions_expires_at ON download_sessions(expires_at);

-- Enable RLS
ALTER TABLE download_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can insert download sessions"
  ON download_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read download sessions by token"
  ON download_sessions FOR SELECT
  USING (true);

-- Add constraints (from migration 005)
-- PostgreSQL doesn't support IF NOT EXISTS with ADD CONSTRAINT, so we use a DO block
DO $$
BEGIN
  -- Add check_download_count_not_exceed_max constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_download_count_not_exceed_max'
  ) THEN
    ALTER TABLE download_sessions
    ADD CONSTRAINT check_download_count_not_exceed_max
    CHECK (download_count <= max_downloads);
  END IF;

  -- Add check_max_downloads_positive constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_max_downloads_positive'
  ) THEN
    ALTER TABLE download_sessions
    ADD CONSTRAINT check_max_downloads_positive
    CHECK (max_downloads > 0);
  END IF;

  -- Add check_expires_at_future constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_expires_at_future'
  ) THEN
    ALTER TABLE download_sessions
    ADD CONSTRAINT check_expires_at_future
    CHECK (expires_at > created_at);
  END IF;
END $$;
