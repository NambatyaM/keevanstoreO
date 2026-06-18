// ============================================================
// Graceful Degradation Utility
// Provides fallback behavior when external services are unavailable
// ============================================================

import { isR2Configured } from "./env-validation";
import { isR2Ready as isR2ClientReady } from "./r2";
import { isPesapalReady as isPesapalClientReady } from "./pesapal";

/**
 * Check if all critical services are configured
 */
export function getServiceStatus() {
  return {
    database: !!process.env.DATABASE_URL && process.env.DATABASE_URL !== "mock",
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== "mock",
    r2: isR2Configured() && isR2ClientReady(),
    pesapal: isPesapalClientReady(),
  };
}

/**
 * Get a user-friendly message about service availability
 */
export function getServiceStatusMessage(): string {
  const status = getServiceStatus();
  const unavailable: string[] = [];

  if (!status.database) unavailable.push("database");
  if (!status.supabase) unavailable.push("authentication");
  if (!status.r2) unavailable.push("file storage");
  if (!status.pesapal) unavailable.push("payment processing");

  if (unavailable.length === 0) {
    return "All services are operational";
  }

  return `Some services are unavailable: ${unavailable.join(", ")}. The application will use fallback modes where possible.`;
}

/**
 * Log service status on startup
 */
export function logServiceStatus(): void {
  const status = getServiceStatus();
  
  console.log("=== Service Status ===");
  console.log(`Database: ${status.database ? "✅ Configured" : "⚠️  Not configured (using mock mode)"}`);
  console.log(`Supabase: ${status.supabase ? "✅ Configured" : "⚠️  Not configured (using mock mode)"}`);
  console.log(`R2 Storage: ${status.r2 ? "✅ Configured" : "⚠️  Not configured (using mock mode)"}`);
  console.log(`Pesapal: ${status.pesapal ? "✅ Configured" : "⚠️  Not configured (using mock mode)"}`);
  console.log("====================");
}

/**
 * Check if the application is in degraded mode
 */
export function isDegradedMode(): boolean {
  const status = getServiceStatus();
  return !status.database || !status.supabase;
}

/**
 * Get appropriate error message based on service availability
 */
export function getErrorMessage(service: string, operation: string): string {
  const status = getServiceStatus();
  
  const serviceMap: Record<string, keyof typeof status> = {
    upload: "r2",
    payment: "pesapal",
    auth: "supabase",
    database: "database",
  };

  const serviceKey = serviceMap[service] || "database";
  
  if (!status[serviceKey]) {
    return `${operation} is currently unavailable. ${service.charAt(0).toUpperCase() + service.slice(1)} service is not configured. Please contact support.`;
  }
  
  return `${operation} failed. Please try again later.`;
}
