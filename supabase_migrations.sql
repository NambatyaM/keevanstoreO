-- ============================================================
-- Supabase Database RPC Functions & Admin Setup
-- ============================================================
-- Run this SQL in your Supabase SQL Editor to:
-- 1. Add required RPC functions for atomic operations
-- 2. Set up an admin user
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE 'Starting Supabase database migrations...';
END $$;

-- ============================================================
-- RPC FUNCTION: process_withdrawal_request
-- Atomically deducts balance and creates withdrawal
-- Matches actual database schema: creators.id (UUID), withdrawals table structure
-- ============================================================
CREATE OR REPLACE FUNCTION process_withdrawal_request(
  p_creator_id UUID,
  p_amount INTEGER,
  p_phone_number TEXT,
  p_provider TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_withdrawal_id UUID;
BEGIN
  -- Lock the creator row to prevent concurrent modifications
  SELECT balance INTO v_current_balance
  FROM creators
  WHERE id = p_creator_id
  FOR UPDATE;

  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct balance atomically
  UPDATE creators
  SET balance = balance - p_amount
  WHERE id = p_creator_id;

  -- Generate UUID for withdrawal
  v_new_withdrawal_id := gen_random_uuid();

  -- Create withdrawal record matching actual database schema
  INSERT INTO withdrawals (
    id,
    creator_id,
    amount,
    method,
    account_details,
    status,
    requested_at
  )
  VALUES (
    v_new_withdrawal_id,
    p_creator_id,
    p_amount,
    'mobile_money',
    jsonb_build_object(
      'phone_number', p_phone_number,
      'provider', p_provider
    ),
    'pending',
    NOW()
  );

  RAISE NOTICE 'Withdrawal request processed successfully for creator % (ID: %)', p_creator_id, v_new_withdrawal_id;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✓ Function process_withdrawal_request created/updated successfully';
END $$;

-- ============================================================
-- RPC FUNCTION: refund_withdrawal
-- Atomically refunds balance on withdrawal rejection
-- Matches actual database schema: withdrawals table structure
-- ============================================================
CREATE OR REPLACE FUNCTION refund_withdrawal(
  p_withdrawal_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id UUID;
  v_amount INTEGER;
  v_current_status TEXT;
BEGIN
  -- Lock the withdrawal row and get details
  SELECT creator_id, amount, status INTO v_creator_id, v_amount, v_current_status
  FROM withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  -- Check if withdrawal exists and is still pending
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  IF v_current_status != 'pending' THEN
    RAISE EXCEPTION 'Withdrawal is not pending, cannot refund';
  END IF;

  -- Lock the creator row to prevent concurrent modifications
  SELECT balance INTO v_current_status
  FROM creators
  WHERE id = v_creator_id
  FOR UPDATE;

  -- Refund balance atomically
  UPDATE creators
  SET balance = balance + v_amount
  WHERE id = v_creator_id;

  RAISE NOTICE 'Withdrawal refunded successfully for withdrawal %', p_withdrawal_id;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✓ Function refund_withdrawal created/updated successfully';
END $$;

-- ============================================================
-- RPC FUNCTION: process_completed_payment
-- Atomically processes payment completion
-- Updates order status, creator balance, product sales, event tickets
-- Matches actual database schema: orders, creators, products, events, tickets, download_sessions
-- ============================================================
CREATE OR REPLACE FUNCTION process_completed_payment(
  p_order_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id UUID;
  v_product_id UUID;
  v_creator_earning INTEGER;
  v_product_type TEXT;
  v_buyer_email TEXT;
  v_buyer_name TEXT;
  v_event_id UUID;
  v_event_capacity INTEGER;
  v_event_tickets_sold INTEGER;
  v_new_ticket_id UUID;
  v_new_session_id UUID;
BEGIN
  -- Lock the order row and get details
  SELECT
    creator_id,
    product_id,
    creator_earning,
    buyer_email,
    buyer_name
  INTO
    v_creator_id,
    v_product_id,
    v_creator_earning,
    v_buyer_email,
    v_buyer_name
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  -- Check if order exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Update order status to completed
  UPDATE orders
  SET status = 'completed',
      updated_at = NOW()
  WHERE id = p_order_id;

  -- Lock creator row and update balance atomically
  UPDATE creators
  SET balance = balance + v_creator_earning,
      total_earnings = total_earnings + v_creator_earning,
      total_sales = total_sales + 1
  WHERE id = v_creator_id;

  -- If this is a product purchase (not a donation)
  IF v_product_id IS NOT NULL THEN
    -- Get product details
    SELECT type INTO v_product_type
    FROM products
    WHERE id = v_product_id
    FOR UPDATE;

    -- Update product sales count
    UPDATE products
    SET sales_count = sales_count + 1
    WHERE id = v_product_id;

    -- If this is an event, create tickets
    IF v_product_type = 'event' THEN
      -- Get event details
      SELECT id, capacity, tickets_sold INTO v_event_id, v_event_capacity, v_event_tickets_sold
      FROM events
      WHERE product_id = v_product_id
      FOR UPDATE;

      -- Check capacity
      IF v_event_tickets_sold >= v_event_capacity THEN
        RAISE EXCEPTION 'Event is at full capacity';
      END IF;

      -- Increment tickets sold
      UPDATE events
      SET tickets_sold = tickets_sold + 1
      WHERE id = v_event_id;

      -- Generate UUID for ticket
      v_new_ticket_id := gen_random_uuid();

      -- Create ticket matching actual database schema
      INSERT INTO tickets (
        id,
        order_id,
        event_id,
        buyer_email,
        buyer_name,
        qr_code_data,
        checked_in,
        checked_in_at
      )
      VALUES (
        v_new_ticket_id,
        p_order_id,
        v_event_id,
        v_buyer_email,
        v_buyer_name,
        'QR-' || p_order_id,
        false,
        NULL
      );
    ELSE
      -- For digital products, create download session
      v_new_session_id := gen_random_uuid();

      INSERT INTO download_sessions (
        id,
        order_id,
        product_id,
        download_token,
        expires_at,
        download_count,
        max_downloads,
        last_downloaded_at,
        created_at
      )
      VALUES (
        v_new_session_id,
        p_order_id,
        v_product_id,
        encode(gen_random_bytes(32), 'hex'),
        NOW() + INTERVAL '24 hours',
        0,
        5,
        NULL,
        NOW()
      );
    END IF;
  END IF;

  RAISE NOTICE 'Payment completed successfully for order %', p_order_id;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✓ Function process_completed_payment created/updated successfully';
END $$;

-- ============================================================
-- RPC FUNCTION: process_withdrawal_approval
-- Updates withdrawal status to completed (no balance deduction)
-- Balance was already deducted at request time
-- Matches actual database schema: withdrawals table structure
-- ============================================================
CREATE OR REPLACE FUNCTION process_withdrawal_approval(
  p_withdrawal_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update withdrawal status to completed matching actual database schema
  UPDATE withdrawals
  SET status = 'completed',
      processed_at = NOW()
  WHERE id = p_withdrawal_id;

  -- Check if withdrawal was found
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  RAISE NOTICE 'Withdrawal approved successfully for withdrawal %', p_withdrawal_id;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✓ Function process_withdrawal_approval created/updated successfully';
END $$;

-- ============================================================
-- ADMIN USER SETUP
-- ============================================================
-- Option 1: Update an existing user to be admin
-- Replace 'admin@example.com' with the actual admin email
-- ============================================================

-- Uncomment and run this to make an existing creator an admin:
/*
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE creators
  SET is_admin = true
  WHERE email = 'admin@example.com';

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count > 0 THEN
    RAISE NOTICE '✓ Admin user updated successfully for email: admin@example.com';
  ELSE
    RAISE NOTICE '⚠ No creator found with email: admin@example.com';
  END IF;
END $$;
*/

-- ============================================================
-- Option 2: Insert a new admin user directly
-- This creates both the Supabase auth user and the creator profile
-- ============================================================

-- Uncomment and run this to create a new admin user:
/*
-- Step 1: Create the auth user (run this in Supabase Dashboard > Authentication > Users > Add User)
-- Email: admin@example.com
-- Password: [your-secure-password]
-- Auto-confirm email: Yes

-- Step 2: After creating the auth user, get the user ID and run:
DO $$
BEGIN
  INSERT INTO creators (
    id,
    email,
    username,
    display_name,
    bio,
    is_admin,
    is_active,
    is_verified,
    balance,
    total_earnings,
    total_sales,
    total_views,
    created_at,
    updated_at
  )
  VALUES (
    '[AUTH_USER_ID_FROM_STEP_1]'::UUID,  -- Replace with actual UUID from auth.users
    'admin@example.com',
    'admin',
    'Admin User',
    'Platform administrator',
    true,  -- is_admin
    true,  -- is_active
    true,  -- is_verified
    0,     -- balance
    0,     -- total_earnings
    0,     -- total_sales
    0,     -- total_views
    NOW(),
    NOW()
  );

  RAISE NOTICE '✓ Admin user created successfully with email: admin@example.com';
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE '⚠ Creator with this email or username already exists';
END $$;
*/

-- ============================================================
-- VERIFICATION QUERIES
-- Run these to verify the setup
-- ============================================================

-- Check if RPC functions exist
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'process_withdrawal_request',
  'refund_withdrawal',
  'process_completed_payment',
  'process_withdrawal_approval'
)
ORDER BY routine_name;

-- Check admin users
SELECT
  id,
  email,
  username,
  display_name,
  is_admin,
  is_active
FROM creators
WHERE is_admin = true;

-- Check withdrawals table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'withdrawals'
ORDER BY ordinal_position;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✓ DATABASE MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'RPC Functions Created:';
  RAISE NOTICE '  • process_withdrawal_request';
  RAISE NOTICE '  • refund_withdrawal';
  RAISE NOTICE '  • process_completed_payment';
  RAISE NOTICE '  • process_withdrawal_approval';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Uncomment and run the admin setup section (Option 1 or 2)';
  RAISE NOTICE '  2. Verify admin users by running the verification queries';
  RAISE NOTICE '  3. Test the withdrawal flow in your application';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
