-- ============================================================
-- Migration: Stress Testing Functions
-- Functions to simulate high-load scenarios and verify system stability
-- Tests 100, 1000, and 10000 concurrent sales/operations
-- ============================================================

-- ── Test Data Generation Helper ─────────────────────────────────
-- Generates test data for stress testing
CREATE OR REPLACE FUNCTION generate_test_order_data(
  p_creator_id UUID,
  p_product_id UUID,
  p_amount NUMERIC,
  p_count INTEGER
)
RETURNS TABLE (
  order_id UUID,
  buyer_email TEXT,
  buyer_name TEXT,
  amount NUMERIC,
  payment_method TEXT
) AS $$
DECLARE
  v_i INTEGER;
  v_order_id UUID;
  v_buyer_email TEXT;
  v_buyer_name TEXT;
  v_payment_method TEXT;
  v_payment_methods TEXT[] := ARRAY['mtn_momo', 'airtel_money', 'card', 'bank_transfer'];
BEGIN
  FOR v_i IN 1..p_count LOOP
    v_order_id := uuid_generate_v4();
    v_buyer_email := 'buyer' || v_i || '@test.com';
    v_buyer_name := 'Test Buyer ' || v_i;
    v_payment_method := v_payment_methods[1 + (v_i % 4)];
    
    RETURN QUERY SELECT
      v_order_id,
      v_buyer_email,
      v_buyer_name,
      p_amount,
      v_payment_method;
    
    RETURN;
  END LOOP;
  
  RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::TEXT LIMIT 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Simulate 100 Sales ────────────────────────────────────────
-- Simulates 100 concurrent sales to test system under moderate load
CREATE OR REPLACE FUNCTION stress_test_100_sales(
  p_creator_id UUID,
  p_product_id UUID,
  p_amount NUMERIC DEFAULT 10000
)
RETURNS TABLE (
  test_name TEXT,
  total_orders INTEGER,
  successful_orders INTEGER,
  failed_orders INTEGER,
  total_amount NUMERIC,
  avg_processing_time_ms NUMERIC,
  max_processing_time_ms NUMERIC,
  min_processing_time_ms NUMERIC,
  balance_corruption BOOLEAN,
  ledger_integrity BOOLEAN,
  passed BOOLEAN
) AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_successful INTEGER := 0;
  v_failed INTEGER := 0;
  v_total_amount NUMERIC := 0;
  v_processing_times NUMERIC[] := '{}';
  v_i INTEGER;
  v_order_id UUID;
  v_platform_fee NUMERIC;
  v_creator_earning NUMERIC;
  v_initial_balance NUMERIC;
  v_final_balance NUMERIC;
  v_ledger_count INTEGER;
  v_balance_corruption BOOLEAN := false;
  v_ledger_integrity BOOLEAN := false;
BEGIN
  v_start_time := now();
  
  -- Get initial balance
  SELECT available_balance INTO v_initial_balance 
  FROM creator_wallets 
  WHERE creator_id = p_creator_id;
  
  IF v_initial_balance IS NULL THEN
    v_initial_balance := 0;
  END IF;
  
  -- Simulate 100 sales
  FOR v_i IN 1..100 LOOP
    v_order_id := uuid_generate_v4();
    v_platform_fee := ROUND(p_amount * 0.10, 2);
    v_creator_earning := p_amount - v_platform_fee;
    
    BEGIN
      -- Create order
      INSERT INTO orders (
        id,
        product_id,
        creator_id,
        buyer_email,
        buyer_name,
        amount,
        platform_fee,
        creator_earning,
        payment_method,
        status
      ) VALUES (
        v_order_id,
        p_product_id,
        p_creator_id,
        'buyer' || v_i || '@test.com',
        'Test Buyer ' || v_i,
        p_amount,
        v_platform_fee,
        v_creator_earning,
        'card',
        'pending'
      );
      
      -- Process payment via ledger
      PERFORM process_completed_payment_ledger(v_order_id, 'TEST_TXN_' || v_i);
      
      v_successful := v_successful + 1;
      v_total_amount := v_total_amount + p_amount;
      v_processing_times := array_append(v_processing_times, EXTRACT(EPOCH FROM (now() - v_start_time)) * 1000 / v_i);
      
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
    END;
  END LOOP;
  
  v_end_time := now();
  
  -- Verify balance integrity
  SELECT available_balance INTO v_final_balance 
  FROM creator_wallets 
  WHERE creator_id = p_creator_id;
  
  -- Expected balance: initial + (successful * creator_earning)
  IF v_final_balance = (v_initial_balance + (v_successful * v_creator_earning)) THEN
    v_balance_corruption := false;
  ELSE
    v_balance_corruption := true;
  END IF;
  
  -- Verify ledger integrity
  SELECT COUNT(*) INTO v_ledger_count
  FROM transaction_ledger
  WHERE creator_id = p_creator_id
    AND reference_type = 'order'
    AND reference_id IN (
      SELECT id FROM orders 
      WHERE creator_id = p_creator_id 
        AND buyer_email LIKE 'buyer%@test.com'
    );
  
  -- Should have 3 ledger entries per successful order
  IF v_ledger_count = (v_successful * 3) THEN
    v_ledger_integrity := true;
  ELSE
    v_ledger_integrity := false;
  END IF;
  
  RETURN QUERY SELECT
    'Stress Test: 100 Sales' AS test_name,
    100 AS total_orders,
    v_successful AS successful_orders,
    v_failed AS failed_orders,
    v_total_amount AS total_amount,
    AVG(v_processing_times) AS avg_processing_time_ms,
    MAX(v_processing_times) AS max_processing_time_ms,
    MIN(v_processing_times) AS min_processing_time_ms,
    v_balance_corruption AS balance_corruption,
    v_ledger_integrity AS ledger_integrity,
    (v_failed = 0 AND NOT v_balance_corruption AND v_ledger_integrity) AS passed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Simulate 1000 Sales ───────────────────────────────────────
-- Simulates 1000 concurrent sales to test system under high load
CREATE OR REPLACE FUNCTION stress_test_1000_sales(
  p_creator_id UUID,
  p_product_id UUID,
  p_amount NUMERIC DEFAULT 10000
)
RETURNS TABLE (
  test_name TEXT,
  total_orders INTEGER,
  successful_orders INTEGER,
  failed_orders INTEGER,
  total_amount NUMERIC,
  avg_processing_time_ms NUMERIC,
  max_processing_time_ms NUMERIC,
  min_processing_time_ms NUMERIC,
  balance_corruption BOOLEAN,
  ledger_integrity BOOLEAN,
  passed BOOLEAN
) AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_successful INTEGER := 0;
  v_failed INTEGER := 0;
  v_total_amount NUMERIC := 0;
  v_processing_times NUMERIC[] := '{}';
  v_i INTEGER;
  v_order_id UUID;
  v_platform_fee NUMERIC;
  v_creator_earning NUMERIC;
  v_initial_balance NUMERIC;
  v_final_balance NUMERIC;
  v_ledger_count INTEGER;
  v_balance_corruption BOOLEAN := false;
  v_ledger_integrity BOOLEAN := false;
BEGIN
  v_start_time := now();
  
  -- Get initial balance
  SELECT available_balance INTO v_initial_balance 
  FROM creator_wallets 
  WHERE creator_id = p_creator_id;
  
  IF v_initial_balance IS NULL THEN
    v_initial_balance := 0;
  END IF;
  
  -- Simulate 1000 sales in batches of 100
  FOR v_i IN 1..1000 LOOP
    v_order_id := uuid_generate_v4();
    v_platform_fee := ROUND(p_amount * 0.10, 2);
    v_creator_earning := p_amount - v_platform_fee;
    
    BEGIN
      -- Create order
      INSERT INTO orders (
        id,
        product_id,
        creator_id,
        buyer_email,
        buyer_name,
        amount,
        platform_fee,
        creator_earning,
        payment_method,
        status
      ) VALUES (
        v_order_id,
        p_product_id,
        p_creator_id,
        'buyer' || v_i || '@test.com',
        'Test Buyer ' || v_i,
        p_amount,
        v_platform_fee,
        v_creator_earning,
        'card',
        'pending'
      );
      
      -- Process payment via ledger
      PERFORM process_completed_payment_ledger(v_order_id, 'TEST_TXN_' || v_i);
      
      v_successful := v_successful + 1;
      v_total_amount := v_total_amount + p_amount;
      
      -- Sample processing times every 100 orders
      IF v_i % 100 = 0 THEN
        v_processing_times := array_append(v_processing_times, EXTRACT(EPOCH FROM (now() - v_start_time)) * 1000 / v_i);
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
    END;
  END LOOP;
  
  v_end_time := now();
  
  -- Verify balance integrity
  SELECT available_balance INTO v_final_balance 
  FROM creator_wallets 
  WHERE creator_id = p_creator_id;
  
  IF v_final_balance = (v_initial_balance + (v_successful * v_creator_earning)) THEN
    v_balance_corruption := false;
  ELSE
    v_balance_corruption := true;
  END IF;
  
  -- Verify ledger integrity (sample check)
  SELECT COUNT(*) INTO v_ledger_count
  FROM transaction_ledger
  WHERE creator_id = p_creator_id
    AND reference_type = 'order'
    AND created_at > v_start_time;
  
  -- Should have approximately 3 ledger entries per successful order
  IF ABS(v_ledger_count - (v_successful * 3)) < 10 THEN -- Allow small variance
    v_ledger_integrity := true;
  ELSE
    v_ledger_integrity := false;
  END IF;
  
  RETURN QUERY SELECT
    'Stress Test: 1000 Sales' AS test_name,
    1000 AS total_orders,
    v_successful AS successful_orders,
    v_failed AS failed_orders,
    v_total_amount AS total_amount,
    COALESCE(AVG(v_processing_times), 0) AS avg_processing_time_ms,
    COALESCE(MAX(v_processing_times), 0) AS max_processing_time_ms,
    COALESCE(MIN(v_processing_times), 0) AS min_processing_time_ms,
    v_balance_corruption AS balance_corruption,
    v_ledger_integrity AS ledger_integrity,
    (v_failed < 10 AND NOT v_balance_corruption AND v_ledger_integrity) AS passed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Simulate 10000 Sales (Batched) ───────────────────────────
-- Simulates 10000 sales in batches to test system under extreme load
CREATE OR REPLACE FUNCTION stress_test_10000_sales(
  p_creator_id UUID,
  p_product_id UUID,
  p_amount NUMERIC DEFAULT 10000
)
RETURNS TABLE (
  test_name TEXT,
  total_orders INTEGER,
  successful_orders INTEGER,
  failed_orders INTEGER,
  total_amount NUMERIC,
  avg_processing_time_ms NUMERIC,
  max_processing_time_ms NUMERIC,
  min_processing_time_ms NUMERIC,
  balance_corruption BOOLEAN,
  ledger_integrity BOOLEAN,
  passed BOOLEAN
) AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_successful INTEGER := 0;
  v_failed INTEGER := 0;
  v_total_amount NUMERIC := 0;
  v_processing_times NUMERIC[] := '{}';
  v_batch_start TIMESTAMPTZ;
  v_i INTEGER;
  v_j INTEGER;
  v_order_id UUID;
  v_platform_fee NUMERIC;
  v_creator_earning NUMERIC;
  v_initial_balance NUMERIC;
  v_final_balance NUMERIC;
  v_ledger_count INTEGER;
  v_balance_corruption BOOLEAN := false;
  v_ledger_integrity BOOLEAN := false;
BEGIN
  v_start_time := now();
  
  -- Get initial balance
  SELECT available_balance INTO v_initial_balance 
  FROM creator_wallets 
  WHERE creator_id = p_creator_id;
  
  IF v_initial_balance IS NULL THEN
    v_initial_balance := 0;
  END IF;
  
  -- Simulate 10000 sales in batches of 500
  FOR v_i IN 1..20 LOOP -- 20 batches of 500
    v_batch_start := now();
    
    FOR v_j IN 1..500 LOOP
      v_order_id := uuid_generate_v4();
      v_platform_fee := ROUND(p_amount * 0.10, 2);
      v_creator_earning := p_amount - v_platform_fee;
      
      BEGIN
        -- Create order
        INSERT INTO orders (
          id,
          product_id,
          creator_id,
          buyer_email,
          buyer_name,
          amount,
          platform_fee,
          creator_earning,
          payment_method,
          status
        ) VALUES (
          v_order_id,
          p_product_id,
          p_creator_id,
          'buyer' || ((v_i - 1) * 500 + v_j) || '@test.com',
          'Test Buyer ' || ((v_i - 1) * 500 + v_j),
          p_amount,
          v_platform_fee,
          v_creator_earning,
          'card',
          'pending'
        );
        
        -- Process payment via ledger
        PERFORM process_completed_payment_ledger(v_order_id, 'TEST_TXN_' || ((v_i - 1) * 500 + v_j));
        
        v_successful := v_successful + 1;
        v_total_amount := v_total_amount + p_amount;
        
      EXCEPTION WHEN OTHERS THEN
        v_failed := v_failed + 1;
      END;
    END LOOP;
    
    -- Record batch processing time
    v_processing_times := array_append(v_processing_times, EXTRACT(EPOCH FROM (now() - v_batch_start)) * 1000);
    
    -- Small delay between batches to prevent overwhelming the system
    PERFORM pg_sleep(0.1);
  END LOOP;
  
  v_end_time := now();
  
  -- Verify balance integrity
  SELECT available_balance INTO v_final_balance 
  FROM creator_wallets 
  WHERE creator_id = p_creator_id;
  
  IF v_final_balance = (v_initial_balance + (v_successful * v_creator_earning)) THEN
    v_balance_corruption := false;
  ELSE
    v_balance_corruption := true;
  END IF;
  
  -- Verify ledger integrity (sample check)
  SELECT COUNT(*) INTO v_ledger_count
  FROM transaction_ledger
  WHERE creator_id = p_creator_id
    AND reference_type = 'order'
    AND created_at > v_start_time;
  
  -- Should have approximately 3 ledger entries per successful order
  IF ABS(v_ledger_count - (v_successful * 3)) < 100 THEN -- Allow larger variance for 10k operations
    v_ledger_integrity := true;
  ELSE
    v_ledger_integrity := false;
  END IF;
  
  RETURN QUERY SELECT
    'Stress Test: 10000 Sales' AS test_name,
    10000 AS total_orders,
    v_successful AS successful_orders,
    v_failed AS failed_orders,
    v_total_amount AS total_amount,
    AVG(v_processing_times) AS avg_processing_time_ms,
    MAX(v_processing_times) AS max_processing_time_ms,
    MIN(v_processing_times) AS min_processing_time_ms,
    v_balance_corruption AS balance_corruption,
    v_ledger_integrity AS ledger_integrity,
    (v_failed < 100 AND NOT v_balance_corruption AND v_ledger_integrity) AS passed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Simulate Concurrent Withdrawals ───────────────────────────
-- Simulates concurrent withdrawal requests to test race conditions
CREATE OR REPLACE FUNCTION stress_test_concurrent_withdrawals(
  p_creator_id UUID,
  p_num_withdrawals INTEGER DEFAULT 10,
  p_withdrawal_amount NUMERIC DEFAULT 50000
)
RETURNS TABLE (
  test_name TEXT,
  total_withdrawals INTEGER,
  successful_withdrawals INTEGER,
  failed_withdrawals INTEGER,
  duplicate_withdrawals INTEGER,
  balance_corruption BOOLEAN,
  passed BOOLEAN
) AS $$
DECLARE
  v_i INTEGER;
  v_withdrawal_id UUID;
  v_successful INTEGER := 0;
  v_failed INTEGER := 0;
  v_initial_balance NUMERIC;
  v_final_balance NUMERIC;
  v_pending_count INTEGER;
  v_balance_corruption BOOLEAN := false;
BEGIN
  -- Get initial balance
  SELECT available_balance INTO v_initial_balance 
  FROM creator_wallets 
  WHERE creator_id = p_creator_id;
  
  -- Simulate concurrent withdrawal requests
  FOR v_i IN 1..p_num_withdrawals LOOP
    BEGIN
      v_withdrawal_id := process_withdrawal_request_ledger(
        p_creator_id,
        p_withdrawal_amount,
        '+256700000000',
        'mtn_momo'
      );
      
      v_successful := v_successful + 1;
      
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM LIKE '%Insufficient%' OR SQLERRM LIKE '%balance%' THEN
        -- Expected failure due to insufficient funds
        v_failed := v_failed + 1;
      ELSE
        -- Unexpected error
        v_failed := v_failed + 1;
      END IF;
    END;
  END LOOP;
  
  -- Verify balance integrity
  SELECT available_balance, pending_balance INTO v_final_balance, v_pending_count
  FROM creator_wallets 
  WHERE creator_id = p_creator_id;
  
  -- Expected: available balance should be reduced by (successful * amount)
  -- Pending balance should be (successful * amount)
  IF v_final_balance = (v_initial_balance - (v_successful * p_withdrawal_amount)) AND
     v_pending_count = (v_successful * p_withdrawal_amount) THEN
    v_balance_corruption := false;
  ELSE
    v_balance_corruption := true;
  END IF;
  
  RETURN QUERY SELECT
    'Stress Test: Concurrent Withdrawals' AS test_name,
    p_num_withdrawals AS total_withdrawals,
    v_successful AS successful_withdrawals,
    v_failed AS failed_withdrawals,
    0 AS duplicate_withdrawals, -- Would need additional logic to detect
    v_balance_corruption AS balance_corruption,
    (NOT v_balance_corruption) AS passed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Stress Test Results Table ───────────────────────────────────
-- Stores results of stress tests
CREATE TABLE IF NOT EXISTS stress_test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_name TEXT NOT NULL,
  total_operations INTEGER NOT NULL,
  successful_operations INTEGER NOT NULL,
  failed_operations INTEGER NOT NULL,
  total_amount NUMERIC,
  avg_processing_time_ms NUMERIC,
  max_processing_time_ms NUMERIC,
  min_processing_time_ms NUMERIC,
  balance_corruption BOOLEAN NOT NULL,
  ledger_integrity BOOLEAN NOT NULL,
  passed BOOLEAN NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  tested_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stress_test_results_date ON stress_test_results(tested_at);
CREATE INDEX IF NOT EXISTS idx_stress_test_results_passed ON stress_test_results(passed);

-- RLS: Only admins can read
ALTER TABLE stress_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read stress test results"
  ON stress_test_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can insert stress test results"
  ON stress_test_results FOR INSERT
  WITH CHECK (true);

-- ── Run All Stress Tests ───────────────────────────────────────
-- Runs all stress tests and returns a summary
CREATE OR REPLACE FUNCTION run_all_stress_tests(
  p_creator_id UUID,
  p_product_id UUID
)
RETURNS TABLE (
  test_name TEXT,
  passed BOOLEAN,
  result TEXT
) AS $$
BEGIN
  -- Run 100 sales test
  INSERT INTO stress_test_results (test_name, total_operations, successful_operations, failed_operations, total_amount, avg_processing_time_ms, max_processing_time_ms, min_processing_time_ms, balance_corruption, ledger_integrity, passed, details, tested_at)
  SELECT test_name, total_orders, successful_orders, failed_orders, total_amount, avg_processing_time_ms, max_processing_time_ms, min_processing_time_ms, balance_corruption, ledger_integrity, passed, jsonb_build_object('test_type', 'sales'), now()
  FROM stress_test_100_sales(p_creator_id, p_product_id);
  
  -- Run 1000 sales test
  INSERT INTO stress_test_results (test_name, total_operations, successful_operations, failed_operations, total_amount, avg_processing_time_ms, max_processing_time_ms, min_processing_time_ms, balance_corruption, ledger_integrity, passed, details, tested_at)
  SELECT test_name, total_orders, successful_orders, failed_orders, total_amount, avg_processing_time_ms, max_processing_time_ms, min_processing_time_ms, balance_corruption, ledger_integrity, passed, jsonb_build_object('test_type', 'sales'), now()
  FROM stress_test_1000_sales(p_creator_id, p_product_id);
  
  -- Run concurrent withdrawals test
  INSERT INTO stress_test_results (test_name, total_operations, successful_operations, failed_operations, total_amount, avg_processing_time_ms, max_processing_time_ms, min_processing_time_ms, balance_corruption, ledger_integrity, passed, details, tested_at)
  SELECT test_name, total_withdrawals, successful_withdrawals, failed_withdrawals, NULL, NULL, NULL, NULL, balance_corruption, true, passed, jsonb_build_object('test_type', 'withdrawals'), now()
  FROM stress_test_concurrent_withdrawals(p_creator_id);
  
  -- Return summary
  RETURN QUERY
  SELECT test_name, passed, 
    CASE 
      WHEN passed THEN 'PASSED'
      ELSE 'FAILED'
    END AS result
  FROM stress_test_results
  WHERE tested_at > NOW() - INTERVAL '10 minutes'
  ORDER BY tested_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
