-- ============================================================
-- Pesapal IPN Logs Table
-- Logs all IPN events from Pesapal for debugging and auditing
-- ============================================================

-- Create pesapal_ipn_logs table
CREATE TABLE IF NOT EXISTS pesapal_ipn_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_tracking_id TEXT NOT NULL,
  merchant_reference TEXT NOT NULL,
  raw_status TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_pesapal_ipn_logs_tracking_id ON pesapal_ipn_logs(order_tracking_id);
CREATE INDEX IF NOT EXISTS idx_pesapal_ipn_logs_merchant_ref ON pesapal_ipn_logs(merchant_reference);
CREATE INDEX IF NOT EXISTS idx_pesapal_ipn_logs_received_at ON pesapal_ipn_logs(received_at DESC);

-- Enable RLS
ALTER TABLE pesapal_ipn_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access IPN logs (for security)
CREATE POLICY "Service role full access to IPN logs"
  ON pesapal_ipn_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Ensure orders table has required Pesapal columns
-- ============================================================

-- Add merchant_reference column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'merchant_reference'
  ) THEN
    ALTER TABLE orders ADD COLUMN merchant_reference TEXT UNIQUE;
  END IF;
END $$;

-- Add pesapal_tracking_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'pesapal_tracking_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN pesapal_tracking_id TEXT;
  END IF;
END $$;

-- Add pesapal_merchant_reference column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'pesapal_merchant_reference'
  ) THEN
    ALTER TABLE orders ADD COLUMN pesapal_merchant_reference TEXT;
  END IF;
END $$;

-- Add pesapal_transaction_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'pesapal_transaction_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN pesapal_transaction_id TEXT;
  END IF;
END $$;

-- Add pesapal_payment_method column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'pesapal_payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN pesapal_payment_method TEXT;
  END IF;
END $$;

-- Add customer_phone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_phone TEXT;
  END IF;
END $$;

-- Add customer_first_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_first_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_first_name TEXT;
  END IF;
END $$;

-- Add customer_last_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_last_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_last_name TEXT;
  END IF;
END $$;

-- Add description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'description'
  ) THEN
    ALTER TABLE orders ADD COLUMN description TEXT;
  END IF;
END $$;

-- Create index on merchant_reference for efficient lookups
CREATE INDEX IF NOT EXISTS idx_orders_merchant_reference ON orders(merchant_reference);
