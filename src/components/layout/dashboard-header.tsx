// ============================================================
// Dashboard Header — Page title + user menu
// ============================================================
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  User,
  Settings,
  ExternalLink,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/store": "Store Settings",
  "/products": "Products",
  "/analytics": "Analytics",
  "/withdrawals": "Withdrawals",
  "/events": "Events",
};

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/products/new")) return "Add Product";
  if (pathname.includes("/edit")) return "Edit Product";
  if (pathname.startsWith("/products")) return "Products";
  if (pathname.startsWith("/store")) return "Store Settings";
  if (pathname.startsWith("/analytics")) return "Analytics";
  if (pathname.startsWith("/withdrawals")) return "Withdrawals";
  if (pathname.startsWith("/events")) return "Events";
  return "Dashboard";
}

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [
    { label: "Dashboard", href: "/dashboard" },
  ];

  if (pathname.startsWith("/products/new")) {
    crumbs.push({ label: "Products", href: "/products" });
    crumbs.push({ label: "Add Product", href: "/products/new" });
  } else if (pathname.includes("/edit")) {
    crumbs.push({ label: "Products", href: "/products" });
    crumbs.push({ label: "Edit", href: pathname });
  } else if (pathname !== "/dashboard") {
    const title = getPageTitle(pathname);
    crumbs.push({ label: title, href: pathname });
  }

  return crumbs;
}

export function DashboardHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const title = getPageTitle(pathname);
  const breadcrumbs = getBreadcrumbs(pathname);
  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "KS";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* Left: Breadcrumb + Title */}
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {i < breadcrumbs.length - 1 ? (
                  <Link href={crumb.href} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link href={`/store/${user?.username || "demo"}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              View Store
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{user?.displayName || "Creator"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/store">
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/store/${user?.username || "demo"}`} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Public Store
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
