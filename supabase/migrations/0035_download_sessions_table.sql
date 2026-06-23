-- ============================================================
-- Download Sessions Table
-- ============================================================
-- This table tracks download links for purchased digital products
-- Each download link has a token, expiration, and max download limit

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

CREATE INDEX IF NOT EXISTS idx_download_sessions_token ON download_sessions(download_token);
CREATE INDEX IF NOT EXISTS idx_download_sessions_product_id ON download_sessions(product_id);
CREATE INDEX IF NOT EXISTS idx_download_sessions_order_id ON download_sessions(order_id);
CREATE INDEX IF NOT EXISTS idx_download_sessions_expires_at ON download_sessions(expires_at);

-- Enable RLS
ALTER TABLE download_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert download sessions (created by system after payment)
CREATE POLICY "Anyone can insert download sessions"
  ON download_sessions FOR INSERT
  WITH CHECK (true);

-- Anyone can read download sessions by token (for download access)
CREATE POLICY "Anyone can read download sessions by token"
  ON download_sessions FOR SELECT
  USING (true);
