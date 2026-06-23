-- ============================================================
-- Migration: Automated Financial Reconciliation System
-- Provides daily reconciliation of financial transactions
-- Detects discrepancies, missing transactions, and payment mismatches
-- ============================================================

-- ── Enhanced Daily Reconciliation Function ───────────────────────
-- Comprehensive reconciliation that verifies:
-- - Total buyer payments = platform revenue + creator earnings + refunds
-- - Wallet balances match ledger calculations
-- - Withdrawal states are consistent
-- - No orphaned transactions
CREATE OR REPLACE FUNCTION run_comprehensive_reconciliation(
  p_reconciliation_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  reconciliation_id UUID,
  reconciliation_date DATE,
  total_buyer_payments NUMERIC,
  platform_revenue NUMERIC,
  creator_earnings NUMERIC,
  refunds NUMERIC,
  discrepancy NUMERIC,
  wallet_discrepancies BIGINT,
  withdrawal_issues BIGINT,
  orphaned_transactions BIGINT,
  status TEXT,
  details JSONB
) AS $$
DECLARE
  v_reconciliation_id UUID;
  v_total_buyer_payments NUMERIC;
  v_platform_revenue NUMERIC;
  v_creator_earnings NUMERIC;
  v_refunds NUMERIC;
  v_discrepancy NUMERIC;
  v_wallet_discrepancies BIGINT;
  v_withdrawal_issues BIGINT;
  v_orphaned_transactions BIGINT;
  v_reconciliation_status TEXT;
  v_details JSONB;
BEGIN
  -- Calculate total buyer payments for the day
  SELECT COALESCE(SUM(amount), 0) INTO v_total_buyer_payments
  FROM orders
  WHERE DATE(created_at) = p_reconciliation_date
    AND status = 'completed';

  -- Calculate platform revenue from ledger
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_platform_revenue
  FROM transaction_ledger
  WHERE DATE(created_at) = p_reconciliation_date
    AND transaction_type = 'COMMISSION_DEDUCTED';

  -- Calculate creator earnings from ledger
  SELECT COALESCE(SUM(amount), 0) INTO v_creator_earnings
  FROM transaction_ledger
  WHERE DATE(created_at) = p_reconciliation_date
    AND transaction_type = 'CREATOR_EARNING_CREDITED';

  -- Calculate refunds from ledger
  SELECT COALESCE(SUM(amount), 0) INTO v_refunds
  FROM transaction_ledger
  WHERE DATE(created_at) = p_reconciliation_date
    AND transaction_type = 'REFUND_PROCESSED';

  -- Calculate discrepancy
  v_discrepancy := v_total_buyer_payments - (v_platform_revenue + v_creator_earnings + v_refunds);

  -- Count wallet discrepancies
  SELECT COUNT(*) INTO v_wallet_discrepancies
  FROM (
    SELECT
      w.creator_id,
      (w.available_balance = l.available AND
       w.pending_balance = l.pending AND
       w.withdrawn_balance = l.withdrawn AND
       w.total_earnings = l.earnings) AS is_reconciled
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
    WHERE NOT (w.available_balance = l.available AND
               w.pending_balance = l.pending AND
               w.withdrawn_balance = l.withdrawn AND
               w.total_earnings = l.earnings)
  ) discrepancies;

  -- Count withdrawal issues
  SELECT COUNT(*) INTO v_withdrawal_issues
  FROM (
    SELECT
      w.id,
      (l.transaction_type IS NOT NULL AND
       CASE w.status
         WHEN 'pending' THEN l.transaction_type = 'WITHDRAWAL_REQUESTED'
         WHEN 'approved' THEN l.transaction_type = 'WITHDRAWAL_APPROVED'
         WHEN 'rejected' THEN l.transaction_type = 'WITHDRAWAL_REJECTED'
         WHEN 'paid' THEN l.transaction_type = 'WITHDRAWAL_COMPLETED'
       END AND
       ABS(l.amount) = w.amount) AS is_valid
    FROM withdrawals w
    LEFT JOIN transaction_ledger l ON l.reference_id = w.id AND l.reference_type = 'withdrawal'
    WHERE DATE(w.requested_at) = p_reconciliation_date
      AND NOT (l.transaction_type IS NOT NULL AND
               CASE w.status
                 WHEN 'pending' THEN l.transaction_type = 'WITHDRAWAL_REQUESTED'
                 WHEN 'approved' THEN l.transaction_type = 'WITHDRAWAL_APPROVED'
                 WHEN 'rejected' THEN l.transaction_type = 'WITHDRAWAL_REJECTED'
                 WHEN 'paid' THEN l.transaction_type = 'WITHDRAWAL_COMPLETED'
               END AND
               ABS(l.amount) = w.amount)
  ) issues;

  -- Count orphaned transactions (ledger entries without corresponding records)
  SELECT COUNT(*) INTO v_orphaned_transactions
  FROM transaction_ledger tl
  LEFT JOIN orders o ON tl.reference_id = o.id AND tl.reference_type = 'order'
  LEFT JOIN withdrawals w ON tl.reference_id = w.id AND tl.reference_type = 'withdrawal'
  LEFT JOIN donations d ON tl.reference_id = d.id AND tl.reference_type = 'donation'
  WHERE DATE(tl.created_at) = p_reconciliation_date
    AND o.id IS NULL
    AND w.id IS NULL
    AND d.id IS NULL
    AND tl.reference_id IS NOT NULL;

  -- Determine status
  IF ABS(v_discrepancy) < 0.01 AND v_wallet_discrepancies = 0 AND v_withdrawal_issues = 0 AND v_orphaned_transactions = 0 THEN
    v_reconciliation_status := 'completed';
  ELSE
    v_reconciliation_status := 'discrepancy_found';
  END IF;

  -- Build details
  v_details := jsonb_build_object(
    'total_buyer_payments', v_total_buyer_payments,
    'platform_revenue', v_platform_revenue,
    'creator_earnings', v_creator_earnings,
    'refunds', v_refunds,
    'discrepancy', v_discrepancy,
    'wallet_discrepancies', v_wallet_discrepancies,
    'withdrawal_issues', v_withdrawal_issues,
    'orphaned_transactions', v_orphaned_transactions,
    'calculated_at', now()
  );

  -- Insert reconciliation record
  INSERT INTO financial_reconciliation (
    reconciliation_date,
    total_buyer_payments,
    platform_revenue,
    creator_earnings,
    refunds,
    discrepancy,
    status,
    details
  ) VALUES (
    p_reconciliation_date,
    v_total_buyer_payments,
    v_platform_revenue,
    v_creator_earnings,
    v_refunds,
    v_discrepancy,
    v_reconciliation_status,
    v_details
  ) ON CONFLICT (reconciliation_date) DO UPDATE SET
    total_buyer_payments = EXCLUDED.total_buyer_payments,
    platform_revenue = EXCLUDED.platform_revenue,
    creator_earnings = EXCLUDED.creator_earnings,
    refunds = EXCLUDED.refunds,
    discrepancy = EXCLUDED.discrepancy,
    status = EXCLUDED.status,
    details = EXCLUDED.details,
    updated_at = now()
  RETURNING id INTO v_reconciliation_id;

  -- If discrepancy found, create alert record
  IF v_reconciliation_status = 'discrepancy_found' THEN
    INSERT INTO reconciliation_alerts (
      reconciliation_id,
      alert_type,
      severity,
      message,
      details
    ) VALUES (
      v_reconciliation_id,
      'discrepancy_found',
      CASE
        WHEN ABS(v_discrepancy) > 1000 THEN 'critical'
        WHEN v_wallet_discrepancies > 0 OR v_withdrawal_issues > 0 THEN 'high'
        ELSE 'medium'
      END,
      'Financial discrepancy detected during reconciliation',
      v_details
    );
  END IF;

  RETURN QUERY SELECT
    v_reconciliation_id,
    p_reconciliation_date,
    v_total_buyer_payments,
    v_platform_revenue,
    v_creator_earnings,
    v_refunds,
    v_discrepancy,
    v_wallet_discrepancies,
    v_withdrawal_issues,
    v_orphaned_transactions,
    v_reconciliation_status,
    v_details;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Reconciliation Alerts Table ───────────────────────────────
-- Table to store reconciliation alerts for monitoring
CREATE TABLE IF NOT EXISTS reconciliation_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reconciliation_id UUID REFERENCES financial_reconciliation(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES creators(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_alerts_reconciliation ON reconciliation_alerts(reconciliation_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_alerts_severity ON reconciliation_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_reconciliation_alerts_resolved ON reconciliation_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_reconciliation_alerts_date ON reconciliation_alerts(created_at);

-- RLS: Only admins can read/write
ALTER TABLE reconciliation_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read reconciliation alerts"
  ON reconciliation_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update reconciliation alerts"
  ON reconciliation_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creators WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ── Payment Verification Function ───────────────────────────────
-- Verifies that all completed orders have corresponding ledger entries
CREATE OR REPLACE FUNCTION verify_payment_ledger_integrity(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  order_id UUID,
  order_amount NUMERIC,
  order_status TEXT,
  has_ledger_entry BOOLEAN,
  ledger_entry_count BIGINT,
  ledger_total_amount NUMERIC,
  is_valid BOOLEAN,
  issues TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id AS order_id,
    o.amount AS order_amount,
    o.status AS order_status,
    (COUNT(tl.id) > 0) AS has_ledger_entry,
    COUNT(tl.id) AS ledger_entry_count,
    COALESCE(SUM(tl.amount), 0) AS ledger_total_amount,
    (o.status = 'completed' AND COUNT(tl.id) >= 3) AS is_valid,
    ARRAY(
      CASE
        WHEN o.status = 'completed' AND COUNT(tl.id) = 0 THEN 'No ledger entries for completed order'
        WHEN o.status = 'completed' AND COUNT(tl.id) < 3 THEN 'Insufficient ledger entries (expected 3: SALE_COMPLETED, COMMISSION_DEDUCTED, CREATOR_EARNING_CREDITED)'
        WHEN o.status != 'completed' AND COUNT(tl.id) > 0 THEN 'Ledger entries exist for non-completed order'
        ELSE NULL
      END
    ) FILTER (WHERE CASE
      WHEN o.status = 'completed' AND COUNT(tl.id) = 0 THEN true
      WHEN o.status = 'completed' AND COUNT(tl.id) < 3 THEN true
      WHEN o.status != 'completed' AND COUNT(tl.id) > 0 THEN true
      ELSE false
    END) AS issues
  FROM orders o
  LEFT JOIN transaction_ledger tl ON tl.reference_id = o.id AND tl.reference_type = 'order'
  WHERE (p_date_from IS NULL OR DATE(o.created_at) >= p_date_from)
    AND (p_date_to IS NULL OR DATE(o.created_at) <= p_date_to)
  GROUP BY o.id, o.amount, o.status
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Duplicate Transaction Detection ───────────────────────────
-- Detects potential duplicate transactions based on amount, creator, and time
CREATE OR REPLACE FUNCTION detect_duplicate_transactions(
  p_time_window_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  transaction_id UUID,
  creator_id UUID,
  transaction_type transaction_type,
  amount NUMERIC,
  reference_id UUID,
  reference_type reference_type,
  created_at TIMESTAMPTZ,
  potential_duplicate_id UUID,
  potential_duplicate_created_at TIMESTAMPTZ,
  time_difference_seconds NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tl1.id AS transaction_id,
    tl1.creator_id,
    tl1.transaction_type,
    tl1.amount,
    tl1.reference_id,
    tl1.reference_type,
    tl1.created_at,
    tl2.id AS potential_duplicate_id,
    tl2.created_at AS potential_duplicate_created_at,
    EXTRACT(EPOCH FROM (tl2.created_at - tl1.created_at)) AS time_difference_seconds
  FROM transaction_ledger tl1
  JOIN transaction_ledger tl2 ON
    tl1.creator_id = tl2.creator_id AND
    tl1.transaction_type = tl2.transaction_type AND
    tl1.amount = tl2.amount AND
    tl1.id != tl2.id AND
    ABS(EXTRACT(EPOCH FROM (tl2.created_at - tl1.created_at))) <= (p_time_window_minutes * 60)
  WHERE tl1.created_at > NOW() - INTERVAL '24 hours'
  ORDER BY tl1.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Balance Anomaly Detection ───────────────────────────────────
-- Detects unusual balance changes that may indicate fraud or errors
CREATE OR REPLACE FUNCTION detect_balance_anomalies(
  p_creator_id UUID DEFAULT NULL,
  p_threshold_multiplier NUMERIC DEFAULT 3.0
)
RETURNS TABLE (
  creator_id UUID,
  average_daily_change NUMERIC,
  current_day_change NUMERIC,
  anomaly_score NUMERIC,
  is_anomaly BOOLEAN,
  details TEXT
) AS $$
DECLARE
  v_avg_change NUMERIC;
  v_current_change NUMERIC;
  v_stddev NUMERIC;
  v_threshold NUMERIC;
BEGIN
  -- Calculate average daily balance change for the past 30 days
  SELECT
    AVG(daily_change),
    STDDEV(daily_change)
  INTO v_avg_change, v_stddev
  FROM (
    SELECT
      creator_id,
      DATE(created_at) AS date,
      SUM(amount) AS daily_change
    FROM transaction_ledger
    WHERE created_at > NOW() - INTERVAL '30 days'
      AND (p_creator_id IS NULL OR creator_id = p_creator_id)
    GROUP BY creator_id, DATE(created_at)
  ) daily_changes;

  -- If insufficient data, return empty
  IF v_avg_change IS NULL THEN
    RETURN;
  END IF;

  -- Calculate threshold (average + multiplier * stddev)
  v_threshold := v_avg_change + (p_threshold_multiplier * COALESCE(v_stddev, 0));

  -- Get current day's change
  SELECT COALESCE(SUM(amount), 0) INTO v_current_change
  FROM transaction_ledger
  WHERE DATE(created_at) = CURRENT_DATE
    AND (p_creator_id IS NULL OR creator_id = p_creator_id);

  -- Calculate anomaly score
  RETURN QUERY
  SELECT
    tl.creator_id,
    v_avg_change AS average_daily_change,
    v_current_change AS current_day_change,
    CASE
      WHEN v_stddev > 0 THEN ABS(v_current_change - v_avg_change) / v_stddev
      ELSE 0
    END AS anomaly_score,
    (ABS(v_current_change) > v_threshold) AS is_anomaly,
    CASE
      WHEN ABS(v_current_change) > v_threshold THEN
        'Balance change exceeds threshold: ' || v_current_change || ' (threshold: ' || v_threshold || ')'
      ELSE
        'Normal balance change'
    END AS details
  FROM transaction_ledger tl
  WHERE DATE(tl.created_at) = CURRENT_DATE
    AND (p_creator_id IS NULL OR tl.creator_id = p_creator_id)
  GROUP BY tl.creator_id
  HAVING ABS(SUM(amount)) > v_threshold;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Reconciliation Summary Report ───────────────────────────────
-- Generates a comprehensive summary of reconciliation results
CREATE OR REPLACE FUNCTION reconciliation_summary_report(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  period_start DATE,
  period_end DATE,
  total_reconciliations BIGINT,
  successful_reconciliations BIGINT,
  failed_reconciliations BIGINT,
  total_discrepancy NUMERIC,
  total_platform_revenue NUMERIC,
  total_creator_earnings NUMERIC,
  total_refunds NUMERIC,
  alert_count BIGINT,
  critical_alerts BIGINT,
  high_alerts BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(p_date_from, MIN(reconciliation_date)) AS period_start,
    COALESCE(p_date_to, MAX(reconciliation_date)) AS period_end,
    COUNT(*) AS total_reconciliations,
    COUNT(*) FILTER (WHERE status = 'completed') AS successful_reconciliations,
    COUNT(*) FILTER (WHERE status = 'discrepancy_found') AS failed_reconciliations,
    COALESCE(SUM(ABS(discrepancy)), 0) AS total_discrepancy,
    COALESCE(SUM(platform_revenue), 0) AS total_platform_revenue,
    COALESCE(SUM(creator_earnings), 0) AS total_creator_earnings,
    COALESCE(SUM(refunds), 0) AS total_refunds,
    (SELECT COUNT(*) FROM reconciliation_alerts ra
     JOIN financial_reconciliation fr ON ra.reconciliation_id = fr.id
     WHERE (p_date_from IS NULL OR fr.reconciliation_date >= p_date_from)
       AND (p_date_to IS NULL OR fr.reconciliation_date <= p_date_to)) AS alert_count,
    (SELECT COUNT(*) FROM reconciliation_alerts ra
     JOIN financial_reconciliation fr ON ra.reconciliation_id = fr.id
     WHERE ra.severity = 'critical'
       AND (p_date_from IS NULL OR fr.reconciliation_date >= p_date_from)
       AND (p_date_to IS NULL OR fr.reconciliation_date <= p_date_to)) AS critical_alerts,
    (SELECT COUNT(*) FROM reconciliation_alerts ra
     JOIN financial_reconciliation fr ON ra.reconciliation_id = fr.id
     WHERE ra.severity = 'high'
       AND (p_date_from IS NULL OR fr.reconciliation_date >= p_date_from)
       AND (p_date_to IS NULL OR fr.reconciliation_date <= p_date_to)) AS high_alerts
  FROM financial_reconciliation
  WHERE (p_date_from IS NULL OR reconciliation_date >= p_date_from)
    AND (p_date_to IS NULL OR reconciliation_date <= p_date_to);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Scheduled Reconciliation Function ─────────────────────────
-- This function should be called by a scheduled job (e.g., pg_cron, external scheduler)
-- Runs comprehensive reconciliation for the previous day
CREATE OR REPLACE FUNCTION run_scheduled_reconciliation()
RETURNS UUID AS $$
DECLARE
  v_reconciliation_date DATE;
  v_reconciliation_id UUID;
BEGIN
  -- Reconcile yesterday's data
  v_reconciliation_date := CURRENT_DATE - INTERVAL '1 day';
  
  -- Run comprehensive reconciliation
  SELECT reconciliation_id INTO v_reconciliation_id
  FROM run_comprehensive_reconciliation(v_reconciliation_date)
  LIMIT 1;
  
  RETURN v_reconciliation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
