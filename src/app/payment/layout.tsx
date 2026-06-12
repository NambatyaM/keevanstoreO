// ============================================================
// Payment Layout — Metadata for payment result pages
// ============================================================
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment",
  description: "Payment result page for Keevan Store purchases.",
  robots: { index: false, follow: true },
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
