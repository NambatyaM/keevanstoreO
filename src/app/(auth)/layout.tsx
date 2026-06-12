// ============================================================
// Auth Layout — Shared metadata for login/signup pages
// ============================================================
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Keevan Store creator dashboard to manage your products, view analytics, and withdraw earnings.",
  robots: { index: false, follow: true },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
