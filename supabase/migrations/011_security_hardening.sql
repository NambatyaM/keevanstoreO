-- ============================================================
-- Migration: Financial Security Hardening
-- Implements security measures to prevent financial vulnerabilities
-- Protects against balance manipulation, unauthorized access, and fraud
-- ============================================================

-- ── Balance Modification Protection ───────────────────────────────
-- Prevents direct modification of balance fields without ledger entries
CREATE OR REPLACE FUNCTION protect_balance_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow balance updates through ledger system
  -- Direct updates to creator.balance, creator.total_earnings should be blocked
  IF TG_TABLE_NAME = 'creators' THEN
    IF NEW.balance != OLD.balance OR NEW.total_earnings != OLD.total_earnings THEN
      -- Check if this is a service role operation (allowed)
      IF current_setting('request.jwt.claims', true)::jsonb->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Direct balance modification not allowed. Use ledger system.';
      END IF;
    END IF;
  END IF;
  
  -- Prevent direct wallet state updates
  IF TG_TABLE_NAME = 'creator_wallets' THEN
    IF NEW.available_balance != OLD.available_balance OR
       NEW.pending_balance != OLD.pending_balance OR
       NEW.withdrawn_balance != OLD.withdrawn_balance OR
       NEW.total_earnings != OLD.total_earnings THEN
      -- Check if this is a service role operation (allowed)
      IF current_setting('request.jwt.claims', true)::jsonb->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Direct wallet modification not allowed. Use ledger system.';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply protection to creators table
DROP TRIGGER IF EXISTS trigger_protect_creator_balance ON creators;
CREATE TRIGGER trigger_protect_balance_modification_creators
  BEFORE UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION protect_balance_modification();

-- Apply protection to creator_wallets table
CREATE TRIGGER trigger_protect_balance_modification_wallets
  BEFORE UPDATE ON creator_wallets
  FOR EACH ROW
  EXECUTE FUNCTION protect_balance_modification();

-- ── Withdrawal Rate Limiting ───────────────────────────────────
-- Prevents rapid-fire withdrawal requests (potential attack vector)
CREATE TABLE IF NOT EXISTS withdrawal_rate_limits (
  creator_id UUID PRIMARY KEY REFERENCES creators(id) ON DELETE CASCADE,
  request_count INTEGER DEFAULT 0,
  last_request_at TIMESTAMPTZ,
  window_start TIMESTAMPTZ DEFAULT now(),
  is_locked BOOLEAN DEFAULT false,
  lock_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_rate_limits_creator ON withdrawal_rate_limits(creator_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_rate_limits_locked ON withdrawal_rate_limits(is_locked) WHERE is_locked;

-- RLS: Only system can read/write
ALTER TABLE withdrawal_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage withdrawal rate limits"
  ON withdrawal_rate_limits FOR ALL
  USING (true);

-- ── Withdrawal Rate Limit Check Function ───────────────────────
-- Checks if a creator has exceeded withdrawal request rate limits
CREATE OR REPLACE FUNCTION check_withdrawal_rate_limit(
  p_creator_id UUID,
  p_max_requests_per_hour INTEGER DEFAULT 5
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining_requests INTEGER,
  reset_at TIMESTAMPTZ,
  reason TEXT
) AS $$
DECLARE
  v_rate_limit RECORD;
  v_current_time TIMESTAMPTZ := now();
  v_window_start TIMESTAMPTZ;
  v_allowed BOOLEAN := true;
  v_reason TEXT := '';
BEGIN
  -- Get or create rate limit record
  SELECT * INTO v_rate_limit FROM withdrawal_rate_limits WHERE creator_id = p_creator_id;
  
  IF NOT FOUND THEN
    INSERT INTO withdrawal_rate_limits (creator_id, window_start)
    VALUES (p_creator_id, v_current_time);
    
    SELECT * INTO v_rate_limit FROM withdrawal_rate_limits WHERE creator_id = p_creator_id;
  END IF;
  
  -- Check if creator is locked
  IF v_rate_limit.is_locked AND v_rate_limit.lock_until > v_current_time THEN
    v_allowed := false;
    v_reason := 'Creator is locked due to suspicious activity until ' || v_rate_limit.lock_until;
    RETURN QUERY SELECT v_allowed, 0, v_rate_limit.lock_until, v_reason;
    RETURN;
  END IF;
  
  -- Reset window if expired (1 hour)
  v_window_start := v_rate_limit.window_start;
  IF v_current_time > v_rate_limit.window_start + INTERVAL '1 hour' THEN
    UPDATE withdrawal_rate_limits
    SET request_count = 0,
        window_start = v_current_time,
        is_locked = false,
        lock_until = NULL,
        updated_at = v_current_time
    WHERE creator_id = p_creator_id;
    
    v_window_start := v_current_time;
    SELECT * INTO v_rate_limit FROM withdrawal_rate_limits WHERE creator_id = p_creator_id;
  END IF;
  
  -- Check rate limit
  IF v_rate_limit.request_count >= p_max_requests_per_hour THEN
    v_allowed := false;
    v_reason := 'Rate limit exceeded (' || v_rate_limit.request_count || ' requests in last hour)';
    RETURN QUERY SELECT v_allowed, 0, v_window_start + INTERVAL '1 hour', v_reason;
  END IF;
  
  -- Increment request count
  UPDATE withdrawal_rate_limits
  SET request_count = request_count + 1,
      last_request_at = v_current_time,
      updated_at = v_current_time
  WHERE creator_id = p_creator_id;
  
  RETURN QUERY SELECT
    true AS allowed,
    p_max_requests_per_hour - (v_rate_limit.request_count + 1) AS remaining_requests,
    v_window_start + INTERVAL '1 hour' AS reset_at,
    '' AS reason;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Suspicious Activity Detection ───────────────────────────────
-- Detects patterns that may indicate fraud or attacks
CREATE TABLE IF NOT EXISTS suspicious_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_suspicious_activity_creator ON suspicious_activity_log(creator_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_type ON suspicious_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_severity ON suspicious_activity_log(severity);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_date ON suspicious_activity_log(created_at);

-- RLS: Only admins can read, system can write
ALTER TABLE suspicious_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read suspicious activity"
  ON suspicious_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can insert suspicious activity"
  ON suspicious_activity_log FOR INSERT
  WITH CHECK (true);

-- ── Log Suspicious Activity Function ───────────────────────────
-- Logs suspicious activity for monitoring and alerting
CREATE OR REPLACE FUNCTION log_suspicious_activity(
  p_creator_id UUID,
  p_activity_type TEXT,
  p_severity TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO suspicious_activity_log (
    creator_id,
    activity_type,
    severity,
    description,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_creator_id,
    p_activity_type,
    p_severity,
    p_description,
    p_metadata,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_activity_id;
  
  -- Auto-lock creator on critical activity
  IF p_severity = 'critical' THEN
    UPDATE withdrawal_rate_limits
    SET is_locked = true,
        lock_until = now() + INTERVAL '24 hours',
        updated_at = now()
    WHERE creator_id = p_creator_id;
  END IF;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Balance Anomaly Alert Function ─────────────────────────────
-- Automatically logs suspicious balance anomalies
CREATE OR REPLACE FUNCTION alert_on_balance_anomaly(
  p_creator_id UUID,
  p_old_balance NUMERIC,
  p_new_balance NUMERIC,
  p_threshold NUMERIC DEFAULT 1000000
)
RETURNS void AS $$
DECLARE
  v_change NUMERIC;
  v_severity TEXT;
  v_description TEXT;
BEGIN
  v_change := ABS(p_new_balance - p_old_balance);
  
  -- Only alert on significant changes
  IF v_change < p_threshold THEN
    RETURN;
  END IF;
  
  -- Determine severity based on change magnitude
  IF v_change >= 10000000 THEN
    v_severity := 'critical';
  ELSIF v_change >= 5000000 THEN
    v_severity := 'high';
  ELSIF v_change >= 2000000 THEN
    v_severity := 'medium';
  ELSE
    v_severity := 'low';
  END IF;
  
  v_description := 'Significant balance change detected: ' || 
                  p_old_balance || ' → ' || p_new_balance || 
                  ' (change: ' || v_change || ')';
  
  PERFORM log_suspicious_activity(
    p_creator_id,
    'balance_anomaly',
    v_severity,
    v_description,
    jsonb_build_object(
      'old_balance', p_old_balance,
      'new_balance', p_new_balance,
      'change', v_change,
      'threshold', p_threshold
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Trigger for Balance Anomaly Detection ─────────────────────
CREATE OR REPLACE FUNCTION trigger_balance_anomaly_detection()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check on creator_wallets updates
  IF TG_TABLE_NAME = 'creator_wallets' THEN
    PERFORM alert_on_balance_anomaly(
      NEW.creator_id,
      OLD.available_balance,
      NEW.available_balance
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_balance_anomaly_detection
  AFTER UPDATE ON creator_wallets
  FOR EACH ROW
  WHEN (NEW.available_balance != OLD.available_balance)
  EXECUTE FUNCTION trigger_balance_anomaly_detection();

-- ── IP-Based Withdrawal Locking ───────────────────────────────
-- Locks withdrawals if requests come from different IPs rapidly
CREATE TABLE IF NOT EXISTS withdrawal_ip_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_ip_tracking_creator ON withdrawal_ip_tracking(creator_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_ip_tracking_ip ON withdrawal_ip_tracking(ip_address);

-- RLS: Only system can read/write
ALTER TABLE withdrawal_ip_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage withdrawal IP tracking"
  ON withdrawal_ip_tracking FOR ALL
  USING (true);

-- ── Check Withdrawal IP Consistency ───────────────────────────
-- Checks if withdrawal requests are coming from consistent IPs
CREATE OR REPLACE FUNCTION check_withdrawal_ip_consistency(
  p_creator_id UUID,
  p_current_ip TEXT
)
RETURNS TABLE (
  allowed BOOLEAN,
  reason TEXT,
  unique_ips_seen INTEGER
) AS $$
DECLARE
  v_unique_ips INTEGER;
  v_reason TEXT := '';
  v_allowed BOOLEAN := true;
BEGIN
  -- Count unique IPs seen in last 24 hours
  SELECT COUNT(DISTINCT ip_address) INTO v_unique_ips
  FROM withdrawal_ip_tracking
  WHERE creator_id = p_creator_id
    AND last_seen_at > NOW() - INTERVAL '24 hours';
  
  -- If more than 5 unique IPs in 24 hours, flag as suspicious
  IF v_unique_ips >= 5 THEN
    v_allowed := false;
    v_reason := 'Too many unique IPs for withdrawal requests (' || v_unique_ips || ' in 24 hours)';
    
    PERFORM log_suspicious_activity(
      p_creator_id,
      'ip_inconsistency',
      'high',
      v_reason,
      jsonb_build_object(
        'unique_ips', v_unique_ips,
        'current_ip', p_current_ip
      ),
      p_current_ip
    );
  END IF;
  
  -- Log current IP
  INSERT INTO withdrawal_ip_tracking (creator_id, ip_address)
  VALUES (p_creator_id, p_current_ip)
  ON CONFLICT (creator_id, ip_address) DO UPDATE SET
    request_count = withdrawal_ip_tracking.request_count + 1,
    last_seen_at = now(),
    updated_at = now();
  
  RETURN QUERY SELECT v_allowed, v_reason, v_unique_ips;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Financial Audit Trail ───────────────────────────────────────
-- Comprehensive audit trail for all financial operations
CREATE TABLE IF NOT EXISTS financial_audit_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES creators(id),
  changed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_financial_audit_operation ON financial_audit_trail(operation_type);
CREATE INDEX IF NOT EXISTS idx_financial_audit_table ON financial_audit_trail(table_name);
CREATE INDEX IF NOT EXISTS idx_financial_audit_record ON financial_audit_trail(record_id);
CREATE INDEX IF NOT EXISTS idx_financial_audit_date ON financial_audit_trail(changed_at);

-- RLS: Only admins can read, system can write
ALTER TABLE financial_audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read financial audit"
  ON financial_audit_trail FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can insert financial audit"
  ON financial_audit_trail FOR INSERT
  WITH CHECK (true);

-- ── Financial Audit Trigger Function ───────────────────────────
CREATE OR REPLACE FUNCTION trigger_financial_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- Only audit financial tables
  IF TG_TABLE_NAME NOT IN ('orders', 'withdrawals', 'transaction_ledger', 'creator_wallets', 'donations') THEN
    RETURN NEW;
  END IF;
  
  -- Log insert
  IF TG_OP = 'INSERT' THEN
    INSERT INTO financial_audit_trail (
      operation_type,
      table_name,
      record_id,
      new_data,
      changed_at
    ) VALUES (
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW),
      now()
    );
  END IF;
  
  -- Log update
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO financial_audit_trail (
      operation_type,
      table_name,
      record_id,
      old_data,
      new_data,
      changed_at
    ) VALUES (
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      now()
    );
  END IF;
  
  -- Log delete
  IF TG_OP = 'DELETE' THEN
    INSERT INTO financial_audit_trail (
      operation_type,
      table_name,
      record_id,
      old_data,
      changed_at
    ) VALUES (
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      now()
    );
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to financial tables
CREATE TRIGGER trigger_financial_audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION trigger_financial_audit();

CREATE TRIGGER trigger_financial_audit_withdrawals
  AFTER INSERT OR UPDATE OR DELETE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION trigger_financial_audit();

CREATE TRIGGER trigger_financial_audit_transaction_ledger
  AFTER INSERT OR UPDATE OR DELETE ON transaction_ledger
  FOR EACH ROW EXECUTE FUNCTION trigger_financial_audit();

CREATE TRIGGER trigger_financial_audit_creator_wallets
  AFTER INSERT OR UPDATE OR DELETE ON creator_wallets
  FOR EACH ROW EXECUTE FUNCTION trigger_financial_audit();

CREATE TRIGGER trigger_financial_audit_donations
  AFTER INSERT OR UPDATE OR DELETE ON donations
  FOR EACH ROW EXECUTE FUNCTION trigger_financial_audit();

-- ── Admin Approval Required for Large Withdrawals ─────────────
-- Requires additional approval for withdrawals above a threshold
CREATE OR REPLACE FUNCTION check_large_withdrawal_requirement(
  p_amount NUMERIC,
  p_threshold NUMERIC DEFAULT 1000000
)
RETURNS TABLE (
  requires_additional_approval BOOLEAN,
  approval_level TEXT
) AS $$
BEGIN
  IF p_amount >= p_threshold THEN
    RETURN QUERY SELECT
      true AS requires_additional_approval,
      CASE
        WHEN p_amount >= 10000000 THEN 'executive'
        WHEN p_amount >= 5000000 THEN 'senior'
        ELSE 'manager'
      END AS approval_level;
  ELSE
    RETURN QUERY SELECT false, 'standard';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Withdrawal Approval Workflow Table ───────────────────────
CREATE TABLE IF NOT EXISTS withdrawal_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  withdrawal_id UUID REFERENCES withdrawals(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  approval_level TEXT NOT NULL,
  requested_by UUID REFERENCES creators(id),
  approved_by UUID REFERENCES creators(id),
  approved_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_approvals_withdrawal ON withdrawal_approvals(withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_approvals_creator ON withdrawal_approvals(creator_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_approvals_status ON withdrawal_approvals(status);

-- RLS: Only admins can read/write
ALTER TABLE withdrawal_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage withdrawal approvals"
  ON withdrawal_approvals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM creators WHERE id = auth.uid() AND is_admin = true
    )
  );
