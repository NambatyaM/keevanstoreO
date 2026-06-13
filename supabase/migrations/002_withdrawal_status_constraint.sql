-- ============================================================
-- Migration: Add withdrawal status constraint fix
-- ============================================================
-- The codebase uses withdrawal statuses: 'pending', 'approved',
-- 'rejected', 'paid'. Make sure the CHECK constraint matches.
--
-- Run this SQL in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- Drop existing constraint if it exists (name may vary)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'withdrawals'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%pending%approved%rejected%paid%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE withdrawals DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Add the correct status constraint
ALTER TABLE withdrawals
  ADD CONSTRAINT withdrawals_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'paid'));

-- Verify the constraint
-- SELECT pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'withdrawals'::regclass AND contype = 'c';
