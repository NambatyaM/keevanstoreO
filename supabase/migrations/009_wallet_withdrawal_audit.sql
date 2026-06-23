-- ============================================================
-- Migration: Creator Wallet & Withdrawal Audit System
-- Provides comprehensive audit functions for wallet states and withdrawals
-- Ensures balance integrity and prevents financial discrepancies
-- ============================================================

-- ── Wallet State Verification Function ─────────────────────────
-- Verifies that wallet balances match ledger calculations
-- Detects discrepancies between wallet state and ledger
CREATE OR REPLACE FUNCTION verify_wallet_state(
  p_creator_id UUID
)
RETURNS TABLE (
  creator_id UUID,
  wallet_available NUMERIC,
  ledger_available NUMERIC,
  wallet_pending NUMERIC,
  ledger_pending NUMERIC,
  wallet_withdrawn NUMERIC,
  ledger_withdrawn NUMERIC,
  wallet_total_earnings NUMERIC,
  ledger_total_earnings NUMERIC,
  available_match BOOLEAN,
  pending_match BOOLEAN,
  withdrawn_match BOOLEAN,
  earnings_match BOOLEAN,
  is_reconciled BOOLEAN,
  total_discrepancy NUMERIC
) AS $$
DECLARE
  v_wallet RECORD;
  v_ledger_available NUMERIC;
  v_ledger_pending NUMERIC;
  v_ledger_withdrawn NUMERIC;
  v_ledger_earnings NUMERIC;
BEGIN
  -- Get current wallet state
  SELECT * INTO v_wallet FROM creator_wallets WHERE creator_id = p_creator_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      p_creator_id,
      0, 0, 0, 0, 0, 0, 0, 0,
      true, true, true, true, true, 0;
    RETURN;
  END IF;

  -- Calculate from ledger
  -- Available balance: credits from sales, donations, refunds, rejected withdrawals
  SELECT COALESCE(SUM(amount), 0) INTO v_ledger_available
  FROM transaction_ledger
  WHERE creator_id = p_creator_id
    AND transaction_type IN ('SALE_COMPLETED', 'CREATOR_EARNING_CREDITED', 'DONATION_RECEIVED', 'REFUND_PROCESSED', 'WITHDRAWAL_REJECTED', 'ADJUSTMENT');

  -- Pending balance: funds locked in pending withdrawals
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_ledger_pending
  FROM transaction_ledger
  WHERE creator_id = p_creator_id
    AND transaction_type = 'WITHDRAWAL_REQUESTED';

  -- Withdrawn balance: funds that have been approved/completed
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_ledger_withdrawn
  FROM transaction_ledger
  WHERE creator_id = p_creator_id
    AND transaction_type IN ('WITHDRAWAL_APPROVED', 'WITHDRAWAL_COMPLETED');

  -- Total earnings: all positive credits
  SELECT COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0) INTO v_ledger_earnings
  FROM transaction_ledger
  WHERE creator_id = p_creator_id
    AND transaction_type IN ('SALE_COMPLETED', 'CREATOR_EARNING_CREDITED', 'DONATION_RECEIVED', 'REFUND_PROCESSED', 'WITHDRAWAL_REJECTED', 'ADJUSTMENT');

  RETURN QUERY SELECT
    p_creator_id AS creator_id,
    v_wallet.available_balance AS wallet_available,
    v_ledger_available AS ledger_available,
    v_wallet.pending_balance AS wallet_pending,
    v_ledger_pending AS ledger_pending,
    v_wallet.withdrawn_balance AS wallet_withdrawn,
    v_ledger_withdrawn AS ledger_withdrawn,
    v_wallet.total_earnings AS wallet_total_earnings,
    v_ledger_earnings AS ledger_total_earnings,
    (v_wallet.available_balance = v_ledger_available) AS available_match,
    (v_wallet.pending_balance = v_ledger_pending) AS pending_match,
    (v_wallet.withdrawn_balance = v_ledger_withdrawn) AS withdrawn_match,
    (v_wallet.total_earnings = v_ledger_earnings) AS earnings_match,
    (v_wallet.available_balance = v_ledger_available AND
     v_wallet.pending_balance = v_ledger_pending AND
     v_wallet.withdrawn_balance = v_ledger_withdrawn AND
     v_wallet.total_earnings = v_ledger_earnings) AS is_reconciled,
    ABS(v_wallet.available_balance - v_ledger_available) +
    ABS(v_wallet.pending_balance - v_ledger_pending) +
    ABS(v_wallet.withdrawn_balance - v_ledger_withdrawn) AS total_discrepancy;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Batch Wallet Verification ───────────────────────────────────
-- Verifies wallet states for all creators or a subset
CREATE OR REPLACE FUNCTION verify_all_wallets(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  creator_id UUID,
  is_reconciled BOOLEAN,
  total_discrepancy NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.creator_id,
    (w.available_balance = l.available AND
     w.pending_balance = l.pending AND
     w.withdrawn_balance = l.withdrawn AND
     w.total_earnings = l.earnings) AS is_reconciled,
    ABS(w.available_balance - l.available) +
    ABS(w.pending_balance - l.pending) +
    ABS(w.withdrawn_balance - l.withdrawn) AS total_discrepancy
  FROM creator_wallets w
  CROSS JOIN LATERAL (
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE transaction_type IN ('SALE_COMPLETED', 'CREATOR_EARNING_CREDITED', 'DONATION_RECEIVED', 'REFUND_PROCESSED', 'WITHDRAWAL_REJECTED', 'ADJUSTMENT')), 0) AS available,
      COALESCE(SUM(ABS(amount)) FILTER (WHERE transaction_type = 'WITHDRAWAL_REQUESTED'), 0) AS pending,
      COALESCE(SUM(ABS(amount)) FILTER (WHERE transaction_type IN ('WITHDRAWAL_APPROVED', 'WITHDRAWAL_COMPLETED')), 0) AS withdrawn,
      COALESCE(SUM(amount) FILTER (WHERE amount > 0 AND transaction_type IN ('SALE_COMPLETED', 'CREATOR_EARNING_CREDITED', 'DONATION_RECEIVED', 'REFUND_PROCESSED', 'WITHDRAWAL_REJECTED', 'ADJUSTMENT')), 0) AS earnings
    FROM transaction_ledger
    WHERE transaction_ledger.creator_id = w.creator_id
  ) l
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Withdrawal State Verification ───────────────────────────────
-- Verifies withdrawal states and ensures no double-processing
CREATE OR REPLACE FUNCTION verify_withdrawal_state(
  p_withdrawal_id UUID
)
RETURNS TABLE (
  withdrawal_id UUID,
  status TEXT,
  amount NUMERIC,
  creator_id UUID,
  has_ledger_entry BOOLEAN,
  ledger_transaction_type transaction_type,
  ledger_amount NUMERIC,
  is_valid BOOLEAN,
  issues TEXT[]
) AS $$
DECLARE
  v_withdrawal RECORD;
  v_ledger RECORD;
  v_issues TEXT[] := '{}';
  v_is_valid BOOLEAN := true;
BEGIN
  -- Get withdrawal details
  SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found: %', p_withdrawal_id;
  END IF;

  -- Check for ledger entry
  SELECT * INTO v_ledger
  FROM transaction_ledger
  WHERE reference_id = p_withdrawal_id
    AND reference_type = 'withdrawal'
  LIMIT 1;

  -- Build issues array
  IF v_ledger IS NULL THEN
    v_issues := array_append(v_issues, 'No ledger entry found');
    v_is_valid := false;
  END IF;

  -- Verify status matches ledger transaction type
  IF v_ledger IS NOT NULL THEN
    CASE v_withdrawal.status
      WHEN 'pending' THEN
        IF v_ledger.transaction_type != 'WITHDRAWAL_REQUESTED' THEN
          v_issues := array_append(v_issues, 'Status is pending but ledger type is ' || v_ledger.transaction_type);
          v_is_valid := false;
        END IF;
      WHEN 'approved' THEN
        IF v_ledger.transaction_type != 'WITHDRAWAL_APPROVED' THEN
          v_issues := array_append(v_issues, 'Status is approved but ledger type is ' || v_ledger.transaction_type);
          v_is_valid := false;
        END IF;
      WHEN 'rejected' THEN
        IF v_ledger.transaction_type != 'WITHDRAWAL_REJECTED' THEN
          v_issues := array_append(v_issues, 'Status is rejected but ledger type is ' || v_ledger.transaction_type);
          v_is_valid := false;
        END IF;
      WHEN 'paid' THEN
        IF v_ledger.transaction_type != 'WITHDRAWAL_COMPLETED' THEN
          v_issues := array_append(v_issues, 'Status is paid but ledger type is ' || v_ledger.transaction_type);
          v_is_valid := false;
        END IF;
    END CASE;

    -- Verify amount matches
    IF ABS(v_ledger.amount) != v_withdrawal.amount THEN
      v_issues := array_append(v_issues, 'Ledger amount ' || v_ledger.amount || ' does not match withdrawal amount ' || v_withdrawal.amount);
      v_is_valid := false;
    END IF;
  END IF;

  RETURN QUERY SELECT
    v_withdrawal.id AS withdrawal_id,
    v_withdrawal.status,
    v_withdrawal.amount,
    v_withdrawal.creator_id,
    (v_ledger IS NOT NULL) AS has_ledger_entry,
    v_ledger.transaction_type,
    v_ledger.amount AS ledger_amount,
    v_is_valid AS is_valid,
    v_issues AS issues;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Batch Withdrawal Verification ─────────────────────────────
-- Verifies all withdrawals for potential issues
CREATE OR REPLACE FUNCTION verify_all_withdrawals(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  withdrawal_id UUID,
  status TEXT,
  is_valid BOOLEAN,
  issues TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id AS withdrawal_id,
    w.status,
    (l.transaction_type IS NOT NULL AND
     CASE w.status
       WHEN 'pending' THEN l.transaction_type = 'WITHDRAWAL_REQUESTED'
       WHEN 'approved' THEN l.transaction_type = 'WITHDRAWAL_APPROVED'
       WHEN 'rejected' THEN l.transaction_type = 'WITHDRAWAL_REJECTED'
       WHEN 'paid' THEN l.transaction_type = 'WITHDRAWAL_COMPLETED'
     END AND
     ABS(l.amount) = w.amount) AS is_valid,
    ARRAY(
      CASE
        WHEN l.transaction_type IS NULL THEN 'No ledger entry found'
        WHEN CASE w.status
          WHEN 'pending' THEN l.transaction_type != 'WITHDRAWAL_REQUESTED'
          WHEN 'approved' THEN l.transaction_type != 'WITHDRAWAL_APPROVED'
          WHEN 'rejected' THEN l.transaction_type != 'WITHDRAWAL_REJECTED'
          WHEN 'paid' THEN l.transaction_type != 'WITHDRAWAL_COMPLETED'
        END THEN 'Status does not match ledger type'
        WHEN ABS(l.amount) != w.amount THEN 'Amount mismatch'
        ELSE NULL
      END
    ) FILTER (WHERE CASE
      WHEN l.transaction_type IS NULL THEN true
      WHEN CASE w.status
        WHEN 'pending' THEN l.transaction_type != 'WITHDRAWAL_REQUESTED'
        WHEN 'approved' THEN l.transaction_type != 'WITHDRAWAL_APPROVED'
        WHEN 'rejected' THEN l.transaction_type != 'WITHDRAWAL_REJECTED'
        WHEN 'paid' THEN l.transaction_type != 'WITHDRAWAL_COMPLETED'
      END THEN true
      WHEN ABS(l.amount) != w.amount THEN true
      ELSE false
    END) AS issues
  FROM withdrawals w
  LEFT JOIN transaction_ledger l ON l.reference_id = w.id AND l.reference_type = 'withdrawal'
  WHERE (p_date_from IS NULL OR DATE(w.requested_at) >= p_date_from)
    AND (p_date_to IS NULL OR DATE(w.requested_at) <= p_date_to);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Withdrawal Audit Log ───────────────────────────────────────
-- Table to log withdrawal verification results
CREATE TABLE IF NOT EXISTS withdrawal_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  withdrawal_id UUID REFERENCES withdrawals(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  has_ledger_entry BOOLEAN NOT NULL,
  ledger_transaction_type transaction_type,
  is_valid BOOLEAN NOT NULL,
  issues TEXT[],
  verified_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_audit_withdrawal ON withdrawal_audit_log(withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_audit_creator ON withdrawal_audit_log(creator_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_audit_date ON withdrawal_audit_log(verified_at);
CREATE INDEX IF NOT EXISTS idx_withdrawal_audit_valid ON withdrawal_audit_log(is_valid) WHERE NOT is_valid;

-- RLS: Only admins can read
ALTER TABLE withdrawal_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read withdrawal audit"
  ON withdrawal_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can insert withdrawal audit"
  ON withdrawal_audit_log FOR INSERT
  WITH CHECK (true);

-- ── Auto-Log Withdrawal Verification ─────────────────────────
-- Trigger to automatically log withdrawal verification on state change
CREATE OR REPLACE FUNCTION log_withdrawal_verification()
RETURNS TRIGGER AS $$
DECLARE
  v_ledger RECORD;
  v_is_valid BOOLEAN;
  v_issues TEXT[] := '{}';
BEGIN
  -- Get ledger entry
  SELECT * INTO v_ledger
  FROM transaction_ledger
  WHERE reference_id = NEW.id
    AND reference_type = 'withdrawal'
  LIMIT 1;

  -- Determine validity
  IF v_ledger IS NULL THEN
    v_is_valid := false;
    v_issues := array_append(v_issues, 'No ledger entry found');
  ELSE
    CASE NEW.status
      WHEN 'pending' THEN
        IF v_ledger.transaction_type != 'WITHDRAWAL_REQUESTED' THEN
          v_is_valid := false;
          v_issues := array_append(v_issues, 'Status mismatch');
        ELSE
          v_is_valid := true;
        END IF;
      WHEN 'approved' THEN
        IF v_ledger.transaction_type != 'WITHDRAWAL_APPROVED' THEN
          v_is_valid := false;
          v_issues := array_append(v_issues, 'Status mismatch');
        ELSE
          v_is_valid := true;
        END IF;
      WHEN 'rejected' THEN
        IF v_ledger.transaction_type != 'WITHDRAWAL_REJECTED' THEN
          v_is_valid := false;
          v_issues := array_append(v_issues, 'Status mismatch');
        ELSE
          v_is_valid := true;
        END IF;
      WHEN 'paid' THEN
        IF v_ledger.transaction_type != 'WITHDRAWAL_COMPLETED' THEN
          v_is_valid := false;
          v_issues := array_append(v_issues, 'Status mismatch');
        ELSE
          v_is_valid := true;
        END IF;
    END CASE;

    IF ABS(v_ledger.amount) != NEW.amount THEN
      v_is_valid := false;
      v_issues := array_append(v_issues, 'Amount mismatch');
    END IF;
  END IF;

  -- Log verification result
  INSERT INTO withdrawal_audit_log (
    withdrawal_id,
    creator_id,
    status,
    amount,
    has_ledger_entry,
    ledger_transaction_type,
    is_valid,
    issues
  ) VALUES (
    NEW.id,
    NEW.creator_id,
    NEW.status,
    NEW.amount,
    (v_ledger IS NOT NULL),
    v_ledger.transaction_type,
    v_is_valid,
    v_issues
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_withdrawal_verification
  AFTER INSERT OR UPDATE OF status ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION log_withdrawal_verification();

-- ── Wallet Reconciliation Function ───────────────────────────────
-- Automatically reconciles wallet state with ledger calculations
-- Should only be used by admins for manual correction
CREATE OR REPLACE FUNCTION reconcile_wallet_with_ledger(
  p_creator_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS void AS $$
DECLARE
  v_wallet RECORD;
  v_ledger_available NUMERIC;
  v_ledger_pending NUMERIC;
  v_ledger_withdrawn NUMERIC;
  v_ledger_earnings NUMERIC;
  v_admin_is_admin BOOLEAN;
BEGIN
  -- Verify admin permissions
  SELECT is_admin INTO v_admin_is_admin
  FROM creators
  WHERE id = p_admin_id;

  IF NOT FOUND OR NOT v_admin_is_admin THEN
    RAISE EXCEPTION 'User % is not an admin', p_admin_id;
  END IF;

  -- Get current wallet state
  SELECT * INTO v_wallet FROM creator_wallets WHERE creator_id = p_creator_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Creator wallet not found: %', p_creator_id;
  END IF;

  -- Calculate from ledger
  SELECT COALESCE(SUM(amount), 0) INTO v_ledger_available
  FROM transaction_ledger
  WHERE creator_id = p_creator_id
    AND transaction_type IN ('SALE_COMPLETED', 'CREATOR_EARNING_CREDITED', 'DONATION_RECEIVED', 'REFUND_PROCESSED', 'WITHDRAWAL_REJECTED', 'ADJUSTMENT');

  SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_ledger_pending
  FROM transaction_ledger
  WHERE creator_id = p_creator_id
    AND transaction_type = 'WITHDRAWAL_REQUESTED';

  SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_ledger_withdrawn
  FROM transaction_ledger
  WHERE creator_id = p_creator_id
    AND transaction_type IN ('WITHDRAWAL_APPROVED', 'WITHDRAWAL_COMPLETED');

  SELECT COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0) INTO v_ledger_earnings
  FROM transaction_ledger
  WHERE creator_id = p_creator_id
    AND transaction_type IN ('SALE_COMPLETED', 'CREATOR_EARNING_CREDITED', 'DONATION_RECEIVED', 'REFUND_PROCESSED', 'WITHDRAWAL_REJECTED', 'ADJUSTMENT');

  -- Update wallet to match ledger
  UPDATE creator_wallets
  SET
    available_balance = v_ledger_available,
    pending_balance = v_ledger_pending,
    withdrawn_balance = v_ledger_withdrawn,
    total_earnings = v_ledger_earnings,
    updated_at = now()
  WHERE creator_id = p_creator_id;

  -- Log the reconciliation as an adjustment
  PERFORM create_ledger_entry(
    p_creator_id,
    'ADJUSTMENT'::transaction_type,
    (v_ledger_available - v_wallet.available_balance),
    NULL,
    'adjustment'::reference_type,
    'Wallet reconciliation: ' || p_reason,
    jsonb_build_object(
      'admin_id', p_admin_id,
      'reason', p_reason,
      'previous_available', v_wallet.available_balance,
      'new_available', v_ledger_available,
      'discrepancy', v_ledger_available - v_wallet.available_balance
    )
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
