// ============================================================
// Keevan Store — Platform Constants
// ============================================================

export const PLATFORM_FEE_PERCENT = 10;
export const CREATOR_EARNING_PERCENT = 90;
export const MIN_PRODUCT_PRICE = 1000; // UGX
export const MIN_WITHDRAWAL_AMOUNT = 50000; // UGX
export const DEFAULT_CURRENCY = "UGX";

// FIXED: Blueprint Phase 3 R2 Security — separate expiry constants.
// Download links are intentionally long (24h) so buyers can access from email.
// Preview/thumbnail signed URLs should use the short expiry (15 min).
export const DOWNLOAD_URL_EXPIRY = 24 * 60 * 60;    // 24 hours — for paid download links
export const PREVIEW_URL_EXPIRY  = 15 * 60;          // 15 minutes — for temporary previews

export const USERNAME_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 30,
  PATTERN: /^[a-z0-9-]+$/,
  PATTERN_MESSAGE: "Username can only contain lowercase letters, numbers, and hyphens",
} as const;

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  digital: "Digital Product",
  event: "Event Ticket",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
  refunded: "Refunded",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mtn_momo: "MTN Mobile Money",
  airtel_money: "Airtel Money",
  bank_transfer: "Bank Transfer",
  card: "Card Payment",
};

export const WITHDRAWAL_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected",
};

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Store", href: "/store", icon: "Store" },
  { label: "Products", href: "/products", icon: "Package" },
  { label: "Analytics", href: "/analytics", icon: "BarChart3" },
  { label: "Withdrawals", href: "/withdrawals", icon: "Wallet" },
  { label: "Events", href: "/events", icon: "Calendar" },
] as const;
