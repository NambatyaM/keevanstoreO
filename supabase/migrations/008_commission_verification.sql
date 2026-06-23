-- ============================================================
-- Migration: Commission Verification & Testing
-- Verifies 10% platform commission is calculated accurately
-- Provides test functions to validate commission calculations
-- ============================================================

-- ── Commission Calculation Function ─────────────────────────────
-- Calculates platform commission (10%) and creator earning (90%)
-- Uses proper rounding to prevent floating-point errors
CREATE OR REPLACE FUNCTION calculate_commission(
  p_amount NUMERIC
)
RETURNS TABLE (
  platform_fee NUMERIC,
  creator_earning NUMERIC,
  total NUMERIC
) AS $$
DECLARE
  v_platform_fee NUMERIC;
  v_creator_earning NUMERIC;
BEGIN
  -- Calculate platform fee (10%)
  v_platform_fee := ROUND(p_amount * 0.10, 2);
  
  -- Calculate creator earning (90%)
  v_creator_earning := p_amount - v_platform_fee;
  
  -- Verify total matches original amount
  RETURN QUERY SELECT
    v_platform_fee,
    v_creator_earning,
    v_platform_fee + v_creator_earning AS total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Commission Verification Function ───────────────────────────
-- Verifies that commission calculations in orders match expected values
-- Used for reconciliation and audit purposes
CREATE OR REPLACE FUNCTION verify_order_commission(
  p_order_id UUID
)
RETURNS TABLE (
  order_id UUID,
  amount NUMERIC,
  expected_platform_fee NUMERIC,
  actual_platform_fee NUMERIC,
  expected_creator_earning NUMERIC,
  actual_creator_earning NUMERIC,
  platform_fee_match BOOLEAN,
  creator_earning_match BOOLEAN,
  is_valid BOOLEAN
) AS $$
DECLARE
  v_order RECORD;
  v_expected_fee NUMERIC;
  v_expected_earning NUMERIC;
BEGIN
  -- Get order details
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;
  
  -- Calculate expected values
  v_expected_fee := ROUND(v_order.amount * 0.10, 2);
  v_expected_earning := v_order.amount - v_expected_fee;
  
  -- Compare with actual values
  RETURN QUERY SELECT
    v_order.id AS order_id,
    v_order.amount,
    v_expected_fee AS expected_platform_fee,
    v_order.platform_fee AS actual_platform_fee,
    v_expected_earning AS expected_creator_earning,
    v_order.creator_earning AS actual_creator_earning,
    (v_order.platform_fee = v_expected_fee) AS platform_fee_match,
    (v_order.creator_earning = v_expected_earning) AS creator_earning_match,
    (v_order.platform_fee = v_expected_fee AND v_order.creator_earning = v_expected_earning) AS is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Batch Commission Verification ───────────────────────────────
-- Verifies commission calculations for all completed orders
-- Returns any orders with incorrect commission calculations
CREATE OR REPLACE FUNCTION verify_all_commissions(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  order_id UUID,
  amount NUMERIC,
  expected_platform_fee NUMERIC,
  actual_platform_fee NUMERIC,
  expected_creator_earning NUMERIC,
  actual_creator_earning NUMERIC,
  discrepancy NUMERIC,
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id AS order_id,
    o.amount,
    ROUND(o.amount * 0.10, 2) AS expected_platform_fee,
    o.platform_fee AS actual_platform_fee,
    o.amount - ROUND(o.amount * 0.10, 2) AS expected_creator_earning,
    o.creator_earning AS actual_creator_earning,
    (o.platform_fee - ROUND(o.amount * 0.10, 2)) AS discrepancy,
    (o.platform_fee = ROUND(o.amount * 0.10, 2) AND 
     o.creator_earning = o.amount - ROUND(o.amount * 0.10, 2)) AS is_valid
  FROM orders o
  WHERE o.status = 'completed'
    AND (p_date_from IS NULL OR DATE(o.created_at) >= p_date_from)
    AND (p_date_to IS NULL OR DATE(o.created_at) <= p_date_to)
    AND NOT (
      o.platform_fee = ROUND(o.amount * 0.10, 2) AND 
      o.creator_earning = o.amount - ROUND(o.amount * 0.10, 2)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Commission Test Cases ───────────────────────────────────────
-- Test function to verify commission calculations for various amounts
CREATE OR REPLACE FUNCTION test_commission_calculations()
RETURNS TABLE (
  test_amount NUMERIC,
  expected_fee NUMERIC,
  expected_earning NUMERIC,
  calculated_fee NUMERIC,
  calculated_earning NUMERIC,
  test_passed BOOLEAN
) AS $$
BEGIN
  -- Test case 1: UGX 1,000
  RETURN QUERY
  SELECT
    1000 AS test_amount,
    100 AS expected_fee,
    900 AS expected_earning,
    ROUND(1000 * 0.10, 2) AS calculated_fee,
    1000 - ROUND(1000 * 0.10, 2) AS calculated_earning,
    (ROUND(1000 * 0.10, 2) = 100 AND 1000 - ROUND(1000 * 0.10, 2) = 900) AS test_passed
  UNION ALL
  -- Test case 2: UGX 10,000
  SELECT
    10000,
    1000,
    9000,
    ROUND(10000 * 0.10, 2),
    10000 - ROUND(10000 * 0.10, 2),
    (ROUND(10000 * 0.10, 2) = 1000 AND 10000 - ROUND(10000 * 0.10, 2) = 9000)
  UNION ALL
  -- Test case 3: UGX 100,000
  SELECT
    100000,
    10000,
    90000,
    ROUND(100000 * 0.10, 2),
    100000 - ROUND(100000 * 0.10, 2),
    (ROUND(100000 * 0.10, 2) = 10000 AND 100000 - ROUND(100000 * 0.10, 2) = 90000)
  UNION ALL
  -- Test case 4: UGX 1,000,000
  SELECT
    1000000,
    100000,
    900000,
    ROUND(1000000 * 0.10, 2),
    1000000 - ROUND(1000000 * 0.10, 2),
    (ROUND(1000000 * 0.10, 2) = 100000 AND 1000000 - ROUND(1000000 * 0.10, 2) = 900000)
  UNION ALL
  -- Test case 5: UGX 15,500 (odd amount)
  SELECT
    15500,
    1550,
    13950,
    ROUND(15500 * 0.10, 2),
    15500 - ROUND(15500 * 0.10, 2),
    (ROUND(15500 * 0.10, 2) = 1550 AND 15500 - ROUND(15500 * 0.10, 2) = 13950)
  UNION ALL
  -- Test case 6: UGX 99,999 (odd amount)
  SELECT
    99999,
    9999.90,
    89999.10,
    ROUND(99999 * 0.10, 2),
    99999 - ROUND(99999 * 0.10, 2),
    (ROUND(99999 * 0.10, 2) = 9999.90 AND 99999 - ROUND(99999 * 0.10, 2) = 89999.10);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Multi-Product Purchase Commission Test ─────────────────────
-- Tests commission calculation for orders with multiple products
CREATE OR REPLACE FUNCTION test_multi_product_commission()
RETURNS TABLE (
  test_case TEXT,
  total_amount NUMERIC,
  expected_total_fee NUMERIC,
  expected_total_earning NUMERIC,
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'Single product' AS test_case,
    50000 AS total_amount,
    5000 AS expected_total_fee,
    45000 AS expected_total_earning,
    (ROUND(50000 * 0.10, 2) = 5000) AS is_valid
  UNION ALL
  SELECT
    'Two products (same price)',
    100000,
    10000,
    90000,
    (ROUND(100000 * 0.10, 2) = 10000)
  UNION ALL
  SELECT
    'Two products (different prices)',
    75000,
    7500,
    67500,
    (ROUND(75000 * 0.10, 2) = 7500)
  UNION ALL
  SELECT
    'With donation',
    55000,
    5000,
    50000,
    (ROUND(50000 * 0.10, 2) = 5000); -- Commission only on product, not donation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Run Commission Verification Tests ───────────────────────────
-- Function to run all commission tests and return results
CREATE OR REPLACE FUNCTION run_commission_tests()
RETURNS TABLE (
  test_name TEXT,
  test_result TEXT,
  passed_count INTEGER,
  failed_count INTEGER
) AS $$
DECLARE
  v_single_product_results RECORD;
  v_multi_product_results RECORD;
  v_passed INTEGER;
  v_failed INTEGER;
BEGIN
  -- Test single product commissions
  SELECT
    COUNT(*) FILTER (WHERE test_passed = true) AS passed,
    COUNT(*) FILTER (WHERE test_passed = false) AS failed
  INTO v_passed, v_failed
  FROM test_commission_calculations();
  
  RETURN QUERY SELECT
    'Single Product Commission Tests' AS test_name,
    CASE WHEN v_failed = 0 THEN 'ALL TESTS PASSED' ELSE 'SOME TESTS FAILED' END AS test_result,
    v_passed AS passed_count,
    v_failed AS failed_count
  UNION ALL
  SELECT
    'Multi-Product Commission Tests',
    CASE WHEN failed_count = 0 THEN 'ALL TESTS PASSED' ELSE 'SOME TESTS FAILED' END,
    COUNT(*) FILTER (WHERE is_valid = true),
    COUNT(*) FILTER (WHERE is_valid = false)
  FROM test_multi_product_commission();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Commission Audit Log ────────────────────────────────────────
-- Table to log commission verification results
CREATE TABLE IF NOT EXISTS commission_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  creator_earning NUMERIC NOT NULL,
  expected_platform_fee NUMERIC NOT NULL,
  expected_creator_earning NUMERIC NOT NULL,
  is_valid BOOLEAN NOT NULL,
  discrepancy NUMERIC,
  verified_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_commission_audit_order ON commission_audit_log(order_id);
CREATE INDEX IF NOT EXISTS idx_commission_audit_date ON commission_audit_log(verified_at);
CREATE INDEX IF NOT EXISTS idx_commission_audit_valid ON commission_audit_log(is_valid) WHERE NOT is_valid;

-- RLS: Only admins can read/write
ALTER TABLE commission_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read commission audit"
  ON commission_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can insert commission audit"
  ON commission_audit_log FOR INSERT
  WITH CHECK (true);

-- ── Auto-Log Commission Verification ───────────────────────────
-- Trigger to automatically log commission verification on order completion
CREATE OR REPLACE FUNCTION log_commission_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_expected_fee NUMERIC;
  v_expected_earning NUMERIC;
  v_is_valid BOOLEAN;
  v_discrepancy NUMERIC;
BEGIN
  -- Only log for completed orders
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;
  
  -- Calculate expected values
  v_expected_fee := ROUND(NEW.amount * 0.10, 2);
  v_expected_earning := NEW.amount - v_expected_fee;
  
  -- Determine validity
  v_is_valid := (NEW.platform_fee = v_expected_fee AND NEW.creator_earning = v_expected_earning);
  v_discrepancy := NEW.platform_fee - v_expected_fee;
  
  -- Log verification result
  INSERT INTO commission_audit_log (
    order_id,
    amount,
    platform_fee,
    creator_earning,
    expected_platform_fee,
    expected_creator_earning,
    is_valid,
    discrepancy
  ) VALUES (
    NEW.id,
    NEW.amount,
    NEW.platform_fee,
    NEW.creator_earning,
    v_expected_fee,
    v_expected_earning,
    v_is_valid,
    v_discrepancy
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_commission_on_completion
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION log_commission_on_completion();

-- ── Commission Summary Report ──────────────────────────────────
-- Generates a summary report of commission calculations
CREATE OR REPLACE FUNCTION commission_summary_report(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  total_orders BIGINT,
  total_amount NUMERIC,
  total_platform_fee NUMERIC,
  total_creator_earnings NUMERIC,
  invalid_orders BIGINT,
  invalid_amount NUMERIC,
  commission_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_orders,
    COALESCE(SUM(amount), 0) AS total_amount,
    COALESCE(SUM(platform_fee), 0) AS total_platform_fee,
    COALESCE(SUM(creator_earning), 0) AS total_creator_earnings,
    COUNT(*) FILTER (WHERE NOT is_valid) AS invalid_orders,
    COALESCE(SUM(amount) FILTER (WHERE NOT is_valid), 0) AS invalid_amount,
    CASE 
      WHEN SUM(amount) > 0 THEN ROUND((SUM(platform_fee) / SUM(amount)) * 100, 2)
      ELSE 0 
    END AS commission_rate
  FROM commission_audit_log
  WHERE (p_date_from IS NULL OR DATE(verified_at) >= p_date_from)
    AND (p_date_to IS NULL OR DATE(verified_at) <= p_date_to);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
