// ============================================================
// Dashboard Layout — Sidebar + Header + Content
// ============================================================
"use client";

import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top spacer for the fixed mobile header */}
        <div className="h-14 md:hidden" />
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
