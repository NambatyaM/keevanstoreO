// ============================================================
// Dashboard Sidebar — Collapsible navigation
// ============================================================
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Store,
  Package,
  BarChart3,
  Wallet,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Store", href: "/store", icon: Store },
  { label: "Products", href: "/products", icon: Package },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Withdrawals", href: "/withdrawals", icon: Wallet },
  { label: "Events", href: "/events", icon: Calendar },
];

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "KS";

  return (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className={cn("flex items-center gap-2 px-4 py-4 border-b", collapsed ? "justify-center" : "")}>
        <Image src="/logo-new.png" alt="Keevan Store" width={32} height={32} className="rounded-lg flex-shrink-0" />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm">Keevan Store</span>
            <span className="text-[10px] text-muted-foreground">Creator Dashboard</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-emerald-600 dark:text-emerald-400")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User Profile */}
      <div className={cn("p-3 flex items-center gap-3", collapsed && "justify-center")}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.displayName || "Creator"}</p>
            <p className="text-xs text-muted-foreground truncate">@{user?.username || "username"}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r bg-card h-screen sticky top-0 transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <SidebarContent collapsed={collapsed} />
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-7 h-6 w-6 rounded-full border bg-card shadow-sm z-10"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo-new.png" alt="Keevan Store" width={28} height={28} className="rounded-lg" />
          <span className="font-bold text-foreground text-sm">Keevan Store</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent
              collapsed={false}
              onNavigate={() => {
                // Sheet closes automatically on link click
              }}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
