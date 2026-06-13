// ============================================================
// Admin Layout — Checks that the user is authenticated AND is an admin
// Redirects non-admins away from /admin
// ============================================================
"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, checkSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (isLoading) return;

    // Not logged in → send to login
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    // Logged in but not an admin → send to their dashboard
    if (!user.isAdmin) {
      router.push("/dashboard");
      return;
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Derive the "still verifying" state from existing values
  const isVerifiedAdmin = useMemo(
    () => isAuthenticated && !!user?.isAdmin,
    [isAuthenticated, user]
  );

  if (isLoading || !isVerifiedAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  return <div className="min-h-screen">{children}</div>;
}
