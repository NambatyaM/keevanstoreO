// ============================================================
// Currency Display Component — UGX formatting
// ============================================================
"use client";

import { cn } from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/lib/constants";

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showDecimals?: boolean;
}

export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  showDecimals: boolean = false
): string {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg font-semibold",
  xl: "text-2xl font-bold",
};

export function CurrencyDisplay({
  amount,
  currency = DEFAULT_CURRENCY,
  className,
  size = "md",
  showDecimals = false,
}: CurrencyDisplayProps) {
  return (
    <span className={cn(sizeClasses[size], className)}>
      {formatCurrency(amount, currency, showDecimals)}
    </span>
  );
}
