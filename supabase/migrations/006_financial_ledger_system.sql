-- ============================================================
-- Migration: Financial Ledger System
-- Implements production-grade ledger-based accounting
-- Every financial movement creates a permanent transaction record
-- Balances are calculated from ledger entries, not stored directly
-- ============================================================

-- ── Transaction Types Enum ─────────────────────────────────────
CREATE TYPE transaction_type AS ENUM (
  'SALE_COMPLETED',
  'COMMISSION_DEDUCTED',
  'CREATOR_EARNING_CREDITED',
  'WITHDRAWAL_REQUESTED',
  'WITHDRAWAL_APPROVED',
  'WITHDRAWAL_REJECTED',
  'WITHDRAWAL_COMPLETED',
  'REFUND_PROCESSED',
  'DONATION_RECEIVED',
  'ADJUSTMENT'
);

-- ── Reference Types Enum ───────────────────────────────────────
CREATE TYPE reference_type AS ENUM (
  'order',
  'withdrawal',
  'donation',
  'refund',
  'adjustment'
);

-- ── Transaction Ledger Table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS transaction_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  amount NUMERIC NOT NULL, -- Signed: positive for credits, negative for debits
  balance_after NUMERIC NOT NULL, -- Balance after this transaction
  reference_id UUID, -- Reference to order, withdrawal, etc.
  reference_type reference_type,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Idempotency: prevent duplicate transactions for same reference
  CONSTRAINT unique_reference UNIQUE (reference_id, reference_type),
  
  -- Constraint: balance_after must be non-negative
  CONSTRAINT balance_after_non_negative CHECK (balance_after >= 0)
);

-- Indexes for ledger queries
CREATE INDEX IF NOT EXISTS idx_ledger_creator_created ON transaction_ledger(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON transaction_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON transaction_ledger(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON transaction_ledger(created_at);

-- RLS: Only system can insert/update, creators can read their own ledger
ALTER TABLE transaction_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can read own ledger"
  ON transaction_ledger FOR SELECT
  USING (creator_id = auth.uid());

-- No insert/update policy - only system (service role) can write

-- ── Creator Wallets Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_wallets (
  creator_id UUID PRIMARY KEY REFERENCES creators(id) ON DELETE CASCADE,
  pending_balance NUMERIC DEFAULT 0 NOT NULL CHECK (pending_balance >= 0),
  available_balance NUMERIC DEFAULT 0 NOT NULL CHECK (available_balance >= 0),
  withdrawn_balance NUMERIC DEFAULT 0 NOT NULL CHECK (withdrawn_balance >= 0),
  total_earnings NUMERIC DEFAULT 0 NOT NULL CHECK (total_earnings >= 0),
  total_withdrawn NUMERIC DEFAULT 0 NOT NULL CHECK (total_withdrawn >= 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for wallet queries
CREATE INDEX IF NOT EXISTS idx_wallets_creator ON creator_wallets(creator_id);

-- RLS: Only system can update, creators can read their own wallet
ALTER TABLE creator_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can read own wallet"
  ON creator_wallets FOR SELECT
  USING (creator_id = auth.uid());

-- No insert/update policy - only system (service role) can write

-- ── Financial Reconciliation Table ─────────────────────────────
CREATE TABLE IF NOT EXISTS financial_reconciliation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reconciliation_date DATE UNIQUE NOT NULL,
  total_buyer_payments NUMERIC DEFAULT 0 NOT NULL,
  platform_revenue NUMERIC DEFAULT 0 NOT NULL,
  creator_earnings NUMERIC DEFAULT 0 NOT NULL,
  refunds NUMERIC DEFAULT 0 NOT NULL,
  discrepancy NUMERIC DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'discrepancy_found')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for reconciliation queries
CREATE INDEX IF NOT EXISTS idx_reconciliation_date ON financial_reconciliation(reconciliation_date DESC);

-- RLS: Only admins can read/write
ALTER TABLE financial_reconciliation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read reconciliation"
  ON financial_reconciliation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can insert reconciliation"
  ON financial_reconciliation FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update reconciliation"
  ON financial_reconciliation FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creators WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ── Ledger Entry Function ───────────────────────────────────────
-- This is the ONLY way to create ledger entries
-- It atomically creates the ledger entry and updates the wallet
CREATE OR REPLACE FUNCTION create_ledger_entry(
  p_creator_id UUID,
  p_transaction_type transaction_type,
  p_amount NUMERIC,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type reference_type DEFAULT NULL,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_pending_delta NUMERIC;
  v_available_delta NUMERIC;
  v_withdrawn_delta NUMERIC;
  v_earnings_delta NUMERIC;
BEGIN
  -- Lock creator wallet row to prevent concurrent updates
  SELECT * INTO v_current_balance FROM creator_wallets WHERE creator_id = p_creator_id FOR UPDATE;

  -- If wallet doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO creator_wallets (creator_id)
    VALUES (p_creator_id);
    
    SELECT * INTO v_current_balance FROM creator_wallets WHERE creator_id = p_creator_id FOR UPDATE;
  END IF;

  -- Calculate current available balance
  v_current_balance := v_current_balance.available_balance;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;

  -- Validate balance won't go negative
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance: current=%, change=%, new=%',
      v_current_balance, p_amount, v_new_balance;
  END IF;

  -- Determine wallet state deltas based on transaction type
  v_pending_delta := 0;
  v_available_delta := 0;
  v_withdrawn_delta := 0;
  v_earnings_delta := 0;

  CASE p_transaction_type
    WHEN 'SALE_COMPLETED' THEN
      v_available_delta := p_amount;
      v_earnings_delta := p_amount;
    WHEN 'CREATOR_EARNING_CREDITED' THEN
      v_available_delta := p_amount;
      v_earnings_delta := p_amount;
    WHEN 'DONATION_RECEIVED' THEN
      v_available_delta := p_amount;
      v_earnings_delta := p_amount;
    WHEN 'REFUND_PROCESSED' THEN
      v_available_delta := p_amount;
    WHEN 'WITHDRAWAL_REQUESTED' THEN
      v_pending_delta := p_amount;
      v_available_delta := -p_amount;
    WHEN 'WITHDRAWAL_APPROVED' THEN
      v_pending_delta := -p_amount;
      v_withdrawn_delta := p_amount;
    WHEN 'WITHDRAWAL_REJECTED' THEN
      v_pending_delta := -p_amount;
      v_available_delta := p_amount;
    WHEN 'WITHDRAWAL_COMPLETED' THEN
      -- No wallet state change, already approved
      v_withdrawn_delta := 0;
    WHEN 'ADJUSTMENT' THEN
      v_available_delta := p_amount;
      IF p_amount > 0 THEN
        v_earnings_delta := p_amount;
      END IF;
  END CASE;

  -- Insert ledger entry
  INSERT INTO transaction_ledger (
    creator_id,
    transaction_type,
    amount,
    balance_after,
    reference_id,
    reference_type,
    description,
    metadata
  ) VALUES (
    p_creator_id,
    p_transaction_type,
    p_amount,
    v_new_balance,
    p_reference_id,
    p_reference_type,
    p_description,
    p_metadata
  );

  -- Update wallet state
  UPDATE creator_wallets
  SET
    pending_balance = pending_balance + v_pending_delta,
    available_balance = available_balance + v_available_delta,
    withdrawn_balance = withdrawn_balance + v_withdrawn_delta,
    total_earnings = total_earnings + v_earnings_delta,
    total_withdrawn = total_withdrawn + v_withdrawn_delta,
    updated_at = now()
  WHERE creator_id = p_creator_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Calculate Balance from Ledger ───────────────────────────────
-- This function recalculates balance from ledger entries
-- Used for reconciliation and verification
CREATE OR REPLACE FUNCTION calculate_balance_from_ledger(
  p_creator_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM transaction_ledger
  WHERE creator_id = p_creator_id;
  
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Reconcile Wallet Function ────────────────────────────────────
-- Verifies wallet balance matches ledger calculation
CREATE OR REPLACE FUNCTION reconcile_wallet(
  p_creator_id UUID
)
RETURNS TABLE (
  wallet_available NUMERIC,
  ledger_available NUMERIC,
  wallet_pending NUMERIC,
  ledger_pending NUMERIC,
  wallet_withdrawn NUMERIC,
  ledger_withdrawn NUMERIC,
  is_reconciled BOOLEAN
) AS $$
DECLARE
  v_wallet RECORD;
  v_ledger_available NUMERIC;
  v_ledger_pending NUMERIC;
  v_ledger_withdrawn NUMERIC;
BEGIN
  -- Get current wallet state
  SELECT * INTO v_wallet FROM creator_wallets WHERE creator_id = p_creator_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 0, 0, 0, 0, 0, false;
    RETURN;
  END IF;

  -- Calculate from ledger
  SELECT COALESCE(SUM(amount), 0) INTO v_ledger_available
  FROM transaction_ledger
  WHERE creator_id = p_creator_id
    AND transaction_type IN ('SALE_COMPLETED', 'CREATOR_EARNING_CREDITED', 'DONATION_RECEIVED', 'REFUND_PROCESSED', 'WITHDRAWAL_REJECTED', 'ADJUSTMENT');

  SELECT COALESCE(SUM(amount), 0) INTO v_ledger_pending
  FROM transaction_ledger
  WHERE creator_id = p_creator_id
    AND transaction_type = 'WITHDRAWAL_REQUESTED';

  SELECT COALESCE(SUM(amount), 0) INTO v_ledger_withdrawn
  FROM transaction_ledger
  WHERE creator_id = p_creator_id
    AND transaction_type IN ('WITHDRAWAL_APPROVED', 'WITHDRAWAL_COMPLETED');

  RETURN QUERY SELECT
    v_wallet.available_balance,
    v_ledger_available,
    v_wallet.pending_balance,
    v_ledger_pending,
    v_wallet.withdrawn_balance,
    v_ledger_withdrawn,
    (v_wallet.available_balance = v_ledger_available AND
     v_wallet.pending_balance = v_ledger_pending AND
     v_wallet.withdrawn_balance = v_ledger_withdrawn);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Initialize Wallets for Existing Creators ───────────────────
-- This function creates wallet records for existing creators
CREATE OR REPLACE FUNCTION initialize_creator_wallets()
RETURNS void AS $$
BEGIN
  INSERT INTO creator_wallets (creator_id)
  SELECT id FROM creators
  ON CONFLICT (creator_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run initialization
SELECT initialize_creator_wallets();

-- ── Trigger to Auto-Create Wallet on New Creator ───────────────
CREATE OR REPLACE FUNCTION create_wallet_on_new_creator()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO creator_wallets (creator_id)
  VALUES (NEW.id)
  ON CONFLICT (creator_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_wallet_on_new_creator
  AFTER INSERT ON creators
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_on_new_creator();
