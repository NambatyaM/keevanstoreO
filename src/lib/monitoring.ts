// ============================================================
// Monitoring & Observability Module
// Production-grade error tracking, activity logging, and metrics
// ============================================================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "critical";
  category: "payment" | "withdrawal" | "upload" | "download" | "auth" | "database" | "api";
  action: string;
  userId?: string;
  creatorId?: string;
  orderId?: string;
  productId?: string;
  withdrawalId?: string;
  metadata: Record<string, unknown>;
  error?: string;
  stackTrace?: string;
}

export interface SystemMetrics {
  timestamp: string;
  activeUsers: number;
  pendingOrders: number;
  completedOrders: number;
  failedOrders: number;
  pendingWithdrawals: number;
  completedWithdrawals: number;
  rejectedWithdrawals: number;
  totalRevenue: number;
  totalWithdrawals: number;
  apiLatency: {
    p50: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  uptime: number;
}

// In-memory audit log (in production, this should be sent to a logging service)
const auditLog: AuditLogEntry[] = [];
const MAX_LOG_ENTRIES = 10000;

// Metrics tracking
const metricsHistory: SystemMetrics[] = [];
const MAX_METRICS_HISTORY = 1440; // 24 hours at 1-minute intervals

/**
 * Log an audit entry for monitoring and compliance
 */
export function logAudit(entry: Omit<AuditLogEntry, "id" | "timestamp">): void {
  const logEntry: AuditLogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  auditLog.push(logEntry);

  // Trim log if it exceeds max entries
  if (auditLog.length > MAX_LOG_ENTRIES) {
    auditLog.shift();
  }

  // In production, send to external logging service (e.g., Datadog, Sentry, LogRocket)
  // For now, we'll log to console for development
  if (entry.level === "error" || entry.level === "critical") {
    console.error("[AUDIT]", JSON.stringify(logEntry));
  } else if (entry.level === "warn") {
    console.warn("[AUDIT]", JSON.stringify(logEntry));
  } else {
    console.log("[AUDIT]", JSON.stringify(logEntry));
  }
}

/**
 * Get recent audit logs with optional filtering
 */
export function getAuditLogs(filters: {
  level?: AuditLogEntry["level"];
  category?: AuditLogEntry["category"];
  userId?: string;
  creatorId?: string;
  limit?: number;
} = {}): AuditLogEntry[] {
  let filtered = [...auditLog];

  if (filters.level) {
    filtered = filtered.filter((log) => log.level === filters.level);
  }

  if (filters.category) {
    filtered = filtered.filter((log) => log.category === filters.category);
  }

  if (filters.userId) {
    filtered = filtered.filter((log) => log.userId === filters.userId);
  }

  if (filters.creatorId) {
    filtered = filtered.filter((log) => log.creatorId === filters.creatorId);
  }

  // Return most recent first
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (filters.limit) {
    return filtered.slice(0, filters.limit);
  }

  return filtered;
}

/**
 * Record system metrics for monitoring
 */
export function recordMetrics(metrics: Omit<SystemMetrics, "timestamp">): void {
  const metricsEntry: SystemMetrics = {
    timestamp: new Date().toISOString(),
    ...metrics,
  };

  metricsHistory.push(metricsEntry);

  // Trim history if it exceeds max entries
  if (metricsHistory.length > MAX_METRICS_HISTORY) {
    metricsHistory.shift();
  }
}

/**
 * Get recent metrics history
 */
export function getMetricsHistory(minutes: number = 60): SystemMetrics[] {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  return metricsHistory.filter((m) => new Date(m.timestamp) >= cutoff);
}

/**
 * Get current system health status
 */
export function getSystemHealth(): {
  status: "healthy" | "degraded" | "critical";
  checks: Record<string, boolean>;
  uptime: number;
} {
  // In production, this would check actual service health
  // For now, we'll return a basic status
  const checks = {
    database: true,
    storage: true,
    payments: true,
    api: true,
  };

  const failedChecks = Object.values(checks).filter((c) => !c).length;

  let status: "healthy" | "degraded" | "critical" = "healthy";
  if (failedChecks === 0) {
    status = "healthy";
  } else if (failedChecks < 3) {
    status = "degraded";
  } else {
    status = "critical";
  }

  return {
    status,
    checks,
    uptime: process.uptime(),
  };
}

/**
 * Log a payment event
 */
export function logPaymentEvent(event: {
  action: "initiated" | "completed" | "failed" | "refunded";
  orderId: string;
  amount: number;
  creatorId: string;
  paymentMethod: string;
  error?: string;
}): void {
  logAudit({
    level: event.action === "failed" ? "error" : "info",
    category: "payment",
    action: `payment_${event.action}`,
    orderId: event.orderId,
    creatorId: event.creatorId,
    metadata: {
      amount: event.amount,
      paymentMethod: event.paymentMethod,
    },
    error: event.error,
  });
}

/**
 * Log a withdrawal event
 */
export function logWithdrawalEvent(event: {
  action: "requested" | "approved" | "rejected" | "completed" | "failed";
  withdrawalId: string;
  creatorId: string;
  amount: number;
  error?: string;
}): void {
  logAudit({
    level: event.action === "failed" ? "error" : "info",
    category: "withdrawal",
    action: `withdrawal_${event.action}`,
    withdrawalId: event.withdrawalId,
    creatorId: event.creatorId,
    metadata: {
      amount: event.amount,
    },
    error: event.error,
  });
}

/**
 * Log an upload event
 */
export function logUploadEvent(event: {
  action: "started" | "completed" | "failed";
  userId?: string;
  creatorId?: string;
  fileName: string;
  fileSize: number;
  error?: string;
}): void {
  logAudit({
    level: event.action === "failed" ? "error" : "info",
    category: "upload",
    action: `upload_${event.action}`,
    userId: event.userId,
    creatorId: event.creatorId,
    metadata: {
      fileName: event.fileName,
      fileSize: event.fileSize,
    },
    error: event.error,
  });
}

/**
 * Log a download event
 */
export function logDownloadEvent(event: {
  action: "started" | "completed" | "failed" | "expired" | "denied";
  orderId: string;
  productId: string;
  downloadToken: string;
  error?: string;
}): void {
  logAudit({
    level: event.action === "failed" || event.action === "denied" ? "warn" : "info",
    category: "download",
    action: `download_${event.action}`,
    orderId: event.orderId,
    productId: event.productId,
    metadata: {
      downloadToken: event.downloadToken,
    },
    error: event.error,
  });
}

/**
 * Log an authentication event
 */
export function logAuthEvent(event: {
  action: "login" | "logout" | "signup" | "failed" | "session_expired";
  userId?: string;
  email?: string;
  error?: string;
}): void {
  logAudit({
    level: event.action === "failed" ? "warn" : "info",
    category: "auth",
    action: `auth_${event.action}`,
    userId: event.userId,
    metadata: {
      email: event.email,
    },
    error: event.error,
  });
}

/**
 * Log a database event
 */
export function logDatabaseEvent(event: {
  action: string;
  table: string;
  operation: "insert" | "update" | "delete" | "select";
  error?: string;
  duration?: number;
}): void {
  logAudit({
    level: event.error ? "error" : "info",
    category: "database",
    action: `db_${event.operation}_${event.table}`,
    metadata: {
      table: event.table,
      operation: event.operation,
      duration: event.duration,
    },
    error: event.error,
  });
}

/**
 * Log an API event
 */
export function logApiEvent(event: {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  error?: string;
}): void {
  logAudit({
    level: event.statusCode >= 500 ? "error" : event.statusCode >= 400 ? "warn" : "info",
    category: "api",
    action: `api_${event.method}_${event.path}`,
    userId: event.userId,
    metadata: {
      method: event.method,
      path: event.path,
      statusCode: event.statusCode,
      duration: event.duration,
    },
    error: event.error,
  });
}
