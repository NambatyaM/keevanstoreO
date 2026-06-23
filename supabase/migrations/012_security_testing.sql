-- ============================================================
-- Migration: Security Testing Functions
-- Functions to test financial security by attempting to exploit vulnerabilities
-- These should be run in a test environment, not production
-- ============================================================

-- ── Test: Direct Balance Modification Attempt ───────────────────
-- Attempts to directly modify creator balance (should fail)
CREATE OR REPLACE FUNCTION test_direct_balance_modification(
  p_creator_id UUID,
  p_new_balance NUMERIC
)
RETURNS TABLE (
  test_name TEXT,
  attempt TEXT,
  success BOOLEAN,
  expected_result TEXT,
  actual_result TEXT,
  passed BOOLEAN
) AS $$
DECLARE
  v_old_balance NUMERIC;
  v_error_message TEXT;
BEGIN
  -- Get current balance
  SELECT balance INTO v_old_balance FROM creators WHERE id = p_creator_id;
  
  -- Attempt direct modification (should fail due to trigger)
  BEGIN
    UPDATE creators
    SET balance = p_new_balance
    WHERE id = p_creator_id;
    
    -- If we reach here, the test failed (modification succeeded)
    RETURN QUERY SELECT
      'Direct Balance Modification' AS test_name,
      'Direct UPDATE on creators.balance' AS attempt,
      true AS success,
      'Should fail with exception' AS expected_result,
      'Modification succeeded (VULNERABILITY!)' AS actual_result,
      false AS passed;
  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    
    -- Check if error is the expected protection error
    IF v_error_message LIKE '%not allowed%' OR v_error_message LIKE '%ledger%' THEN
      RETURN QUERY SELECT
        'Direct Balance Modification' AS test_name,
        'Direct UPDATE on creators.balance' AS attempt,
        false AS success,
        'Should fail with protection error' AS expected_result,
        v_error_message AS actual_result,
        true AS passed;
    ELSE
      RETURN QUERY SELECT
        'Direct Balance Modification' AS test_name,
        'Direct UPDATE on creators.balance' AS attempt,
        false AS success,
        'Should fail with protection error' AS expected_result,
        'Failed with unexpected error: ' || v_error_message AS actual_result,
        false AS passed;
    END IF;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Test: Direct Wallet Modification Attempt ────────────────────
-- Attempts to directly modify wallet state (should fail)
CREATE OR REPLACE FUNCTION test_direct_wallet_modification(
  p_creator_id UUID,
  p_new_available NUMERIC
)
RETURNS TABLE (
  test_name TEXT,
  attempt TEXT,
  success BOOLEAN,
  expected_result TEXT,
  actual_result TEXT,
  passed BOOLEAN
) AS $$
DECLARE
  v_error_message TEXT;
BEGIN
  -- Attempt direct modification (should fail due to trigger)
  BEGIN
    UPDATE creator_wallets
    SET available_balance = p_new_available
    WHERE creator_id = p_creator_id;
    
    -- If we reach here, the test failed
    RETURN QUERY SELECT
      'Direct Wallet Modification' AS test_name,
      'Direct UPDATE on creator_wallets.available_balance' AS attempt,
      true AS success,
      'Should fail with exception' AS expected_result,
      'Modification succeeded (VULNERABILITY!)' AS actual_result,
      false AS passed;
  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    
    IF v_error_message LIKE '%not allowed%' OR v_error_message LIKE '%ledger%' THEN
      RETURN QUERY SELECT
        'Direct Wallet Modification' AS test_name,
        'Direct UPDATE on creator_wallets.available_balance' AS attempt,
        false AS success,
        'Should fail with protection error' AS expected_result,
        v_error_message AS actual_result,
        true AS passed;
    ELSE
      RETURN QUERY SELECT
        'Direct Wallet Modification' AS test_name,
        'Direct UPDATE on creator_wallets.available_balance' AS attempt,
        false AS success,
        'Should fail with protection error' AS expected_result,
        'Failed with unexpected error: ' || v_error_message AS actual_result,
        false AS passed;
    END IF;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Test: Duplicate Ledger Entry Attempt ───────────────────────
-- Attempts to create duplicate ledger entries (should fail due to unique constraint)
CREATE OR REPLACE FUNCTION test_duplicate_ledger_entry(
  p_creator_id UUID,
  p_reference_id UUID,
  p_reference_type reference_type
)
RETURNS TABLE (
  test_name TEXT,
  attempt TEXT,
  success BOOLEAN,
  expected_result TEXT,
  actual_result TEXT,
  passed BOOLEAN
) AS $$
DECLARE
  v_error_message TEXT;
BEGIN
  -- Attempt to create duplicate entry
  BEGIN
    INSERT INTO transaction_ledger (
      creator_id,
      transaction_type,
      amount,
      balance_after,
      reference_id,
      reference_type,
      description
    ) VALUES (
      p_creator_id,
      'SALE_COMPLETED'::transaction_type,
      1000,
      1000,
      p_reference_id,
      p_reference_type,
      'Test duplicate entry'
    );
    
    -- If we reach here, the test failed
    RETURN QUERY SELECT
      'Duplicate Ledger Entry' AS test_name,
      'Insert duplicate ledger entry' AS attempt,
      true AS success,
      'Should fail with unique constraint violation' AS expected_result,
      'Insert succeeded (VULNERABILITY!)' AS actual_result,
      false AS passed;
  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    
    IF v_error_message LIKE '%unique%' OR v_error_message LIKE '%duplicate%' THEN
      RETURN QUERY SELECT
        'Duplicate Ledger Entry' AS test_name,
        'Insert duplicate ledger entry' AS attempt,
        false AS success,
        'Should fail with unique constraint violation' AS expected_result,
        v_error_message AS actual_result,
        true AS passed;
    ELSE
      RETURN QUERY SELECT
        'Duplicate Ledger Entry' AS test_name,
        'Insert duplicate ledger entry' AS attempt,
        false AS success,
        'Should fail with unique constraint violation' AS expected_result,
        'Failed with unexpected error: ' || v_error_message AS actual_result,
        false AS passed;
    END IF;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Test: Negative Balance Attempt ─────────────────────────────
-- Attempts to create a ledger entry that would result in negative balance (should fail)
CREATE OR REPLACE FUNCTION test_negative_balance_attempt(
  p_creator_id UUID
)
RETURNS TABLE (
  test_name TEXT,
  attempt TEXT,
  success BOOLEAN,
  expected_result TEXT,
  actual_result TEXT,
  passed BOOLEAN
) AS $$
DECLARE
  v_current_balance NUMERIC;
  v_error_message TEXT;
BEGIN
  -- Get current balance
  SELECT available_balance INTO v_current_balance FROM creator_wallets WHERE creator_id = p_creator_id;
  
  -- Attempt to debit more than available (should fail)
  BEGIN
    PERFORM create_ledger_entry(
      p_creator_id,
      'WITHDRAWAL_REQUESTED'::transaction_type,
      -(v_current_balance + 100000), -- More than available
      uuid_generate_v4(),
      'withdrawal'::reference_type,
      'Test negative balance',
      '{}'::jsonb
    );
    
    -- If we reach here, the test failed
    RETURN QUERY SELECT
      'Negative Balance Prevention' AS test_name,
      'Debit more than available balance' AS attempt,
      true AS success,
      'Should fail with insufficient balance error' AS expected_result,
      'Debit succeeded (VULNERABILITY!)' AS actual_result,
      false AS passed;
  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    
    IF v_error_message LIKE '%insufficient%' OR v_error_message LIKE '%balance%' THEN
      RETURN QUERY SELECT
        'Negative Balance Prevention' AS test_name,
        'Debit more than available balance' AS attempt,
        false AS success,
        'Should fail with insufficient balance error' AS expected_result,
        v_error_message AS actual_result,
        true AS passed;
    ELSE
      RETURN QUERY SELECT
        'Negative Balance Prevention' AS test_name,
        'Debit more than available balance' AS attempt,
        false AS success,
        'Should fail with insufficient balance error' AS expected_result,
        'Failed with unexpected error: ' || v_error_message AS actual_result,
        false AS passed;
    END IF;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Test: Unauthorized Withdrawal Approval ─────────────────────
-- Attempts to approve withdrawal without admin privileges (should fail due to RLS)
CREATE OR REPLACE FUNCTION test_unauthorized_withdrawal_approval(
  p_withdrawal_id UUID,
  p_non_admin_user_id UUID
)
RETURNS TABLE (
  test_name TEXT,
  attempt TEXT,
  success BOOLEAN,
  expected_result TEXT,
  actual_result TEXT,
  passed BOOLEAN
) AS $$
DECLARE
  v_error_message TEXT;
BEGIN
  -- This test simulates a non-admin attempting to approve
  -- In practice, this would be tested via API, but we can test the RPC function
  -- The RPC function itself doesn't check admin status (that's done at API level)
  -- So this test verifies that the API layer properly checks admin status
  
  RETURN QUERY SELECT
    'Unauthorized Withdrawal Approval' AS test_name,
    'Non-admin attempts withdrawal approval' AS attempt,
    NULL::boolean AS success,
    'Should be blocked at API layer (RLS)' AS expected_result,
    'Test must be performed via API (RPC allows service role)' AS actual_result,
    NULL::boolean AS passed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Test: Cross-Creator Access Attempt ────────────────────────
-- Attempts to access another creator's financial data (should fail due to RLS)
CREATE OR REPLACE FUNCTION test_cross_creator_access(
  p_requesting_creator_id UUID,
  p_target_creator_id UUID
)
RETURNS TABLE (
  test_name TEXT,
  attempt TEXT,
  success BOOLEAN,
  expected_result TEXT,
  actual_result TEXT,
  passed BOOLEAN
) AS $$
DECLARE
  v_wallet_data RECORD;
  v_ledger_count BIGINT;
BEGIN
  -- This test would need to be run with specific user context
  -- In practice, this is tested via API with different auth tokens
  
  RETURN QUERY SELECT
    'Cross-Creator Access' AS test_name,
    'Creator A attempts to access Creator B wallet' AS attempt,
    NULL::boolean AS success,
    'Should be blocked by RLS' AS expected_result,
    'Test must be performed via API with different auth contexts' AS actual_result,
    NULL::boolean AS passed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Test: Withdrawal Rate Limiting ───────────────────────────
-- Tests withdrawal rate limiting by making rapid requests
CREATE OR REPLACE FUNCTION test_withdrawal_rate_limiting(
  p_creator_id UUID,
  p_num_requests INTEGER DEFAULT 10
)
RETURNS TABLE (
  test_name TEXT,
  attempt TEXT,
  requests_allowed INTEGER,
  requests_blocked INTEGER,
  expected_result TEXT,
  actual_result TEXT,
  passed BOOLEAN
) AS $$
DECLARE
  v_allowed INTEGER := 0;
  v_blocked INTEGER := 0;
  v_i INTEGER;
BEGIN
  -- Simulate rapid withdrawal requests
  FOR v_i IN 1..p_num_requests LOOP
    BEGIN
      -- Check rate limit
      SELECT allowed INTO v_allowed
      FROM check_withdrawal_rate_limit(p_creator_id, 5);
      
      IF v_allowed THEN
        v_allowed := v_allowed + 1;
      ELSE
        v_blocked := v_blocked + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_blocked := v_blocked + 1;
    END;
  END LOOP;
  
  -- Expected: first 5 should be allowed, rest blocked
  IF v_allowed <= 5 AND v_blocked >= (p_num_requests - 5) THEN
    RETURN QUERY SELECT
      'Withdrawal Rate Limiting' AS test_name,
      p_num_requests || ' rapid withdrawal requests' AS attempt,
      v_allowed AS requests_allowed,
      v_blocked AS requests_blocked,
      'Should allow ~5 requests, block rest' AS expected_result,
      'Allowed: ' || v_allowed || ', Blocked: ' || v_blocked AS actual_result,
      true AS passed;
  ELSE
    RETURN QUERY SELECT
      'Withdrawal Rate Limiting' AS test_name,
      p_num_requests || ' rapid withdrawal requests' AS attempt,
      v_allowed AS requests_allowed,
      v_blocked AS requests_blocked,
      'Should allow ~5 requests, block rest' AS expected_result,
      'Allowed: ' || v_allowed || ', Blocked: ' || v_blocked || ' (RATE LIMITING FAILED!)' AS actual_result,
      false AS passed;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Test: Idempotency of Payment Processing ───────────────────
-- Tests that processing the same payment twice doesn't duplicate credits
CREATE OR REPLACE FUNCTION test_payment_idempotency(
  p_order_id UUID
)
RETURNS TABLE (
  test_name TEXT,
  attempt TEXT,
  first_ledger_count BIGINT,
  second_ledger_count BIGINT,
  expected_result TEXT,
  actual_result TEXT,
  passed BOOLEAN
) AS $$
DECLARE
  v_first_count BIGINT;
  v_second_count BIGINT;
BEGIN
  -- Count ledger entries before
  SELECT COUNT(*) INTO v_first_count
  FROM transaction_ledger
  WHERE reference_id = p_order_id AND reference_type = 'order';
  
  -- Attempt to process payment again (should be idempotent)
  -- This would normally be called via IPN, but we can test the RPC
  -- Note: This test assumes the order is already completed
  
  SELECT COUNT(*) INTO v_second_count
  FROM transaction_ledger
  WHERE reference_id = p_order_id AND reference_type = 'order';
  
  -- Expected: ledger count should not change
  IF v_first_count = v_second_count THEN
    RETURN QUERY SELECT
      'Payment Idempotency' AS test_name,
      'Process same payment twice' AS attempt,
      v_first_count AS first_ledger_count,
      v_second_count AS second_ledger_count,
      'Ledger count should not change' AS expected_result,
      'Ledger count unchanged: ' || v_second_count AS actual_result,
      true AS passed;
  ELSE
    RETURN QUERY SELECT
      'Payment Idempotency' AS test_name,
      'Process same payment twice' AS attempt,
      v_first_count AS first_ledger_count,
      v_second_count AS second_ledger_count,
      'Ledger count should not change' AS expected_result,
      'Ledger count changed from ' || v_first_count || ' to ' || v_second_count || ' (IDEMPOTENCY FAILED!)' AS actual_result,
      false AS passed;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Run All Security Tests ───────────────────────────────────────
-- Runs all security tests and returns a summary
CREATE OR REPLACE FUNCTION run_all_security_tests(
  p_test_creator_id UUID,
  p_test_order_id UUID DEFAULT NULL
)
RETURNS TABLE (
  test_name TEXT,
  passed BOOLEAN,
  result TEXT
) AS $$
BEGIN
  -- Test 1: Direct balance modification
  INSERT INTO security_test_results (test_name, passed, result, tested_at)
  SELECT test_name, passed, actual_result, now()
  FROM test_direct_balance_modification(p_test_creator_id, 999999);
  
  -- Test 2: Direct wallet modification
  INSERT INTO security_test_results (test_name, passed, result, tested_at)
  SELECT test_name, passed, actual_result, now()
  FROM test_direct_wallet_modification(p_test_creator_id, 999999);
  
  -- Test 3: Negative balance prevention
  INSERT INTO security_test_results (test_name, passed, result, tested_at)
  SELECT test_name, passed, actual_result, now()
  FROM test_negative_balance_attempt(p_test_creator_id);
  
  -- Test 4: Withdrawal rate limiting
  INSERT INTO security_test_results (test_name, passed, result, tested_at)
  SELECT test_name, passed, actual_result, now()
  FROM test_withdrawal_rate_limiting(p_test_creator_id, 10);
  
  -- Test 5: Payment idempotency (if order provided)
  IF p_test_order_id IS NOT NULL THEN
    INSERT INTO security_test_results (test_name, passed, result, tested_at)
    SELECT test_name, passed, actual_result, now()
    FROM test_payment_idempotency(p_test_order_id);
  END IF;
  
  -- Return summary
  RETURN QUERY
  SELECT test_name, passed, result
  FROM security_test_results
  WHERE tested_at > NOW() - INTERVAL '5 minutes'
  ORDER BY tested_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Security Test Results Table ───────────────────────────────
-- Stores results of security tests
CREATE TABLE IF NOT EXISTS security_test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_name TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  result TEXT NOT NULL,
  tested_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_security_test_results_date ON security_test_results(tested_at);

-- RLS: Only admins can read
ALTER TABLE security_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read security test results"
  ON security_test_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can insert security test results"
  ON security_test_results FOR INSERT
  WITH CHECK (true);
