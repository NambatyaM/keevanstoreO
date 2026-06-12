// ============================================================
// Dashboard Home — Overview with stats and recent activity
// ============================================================
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  Eye,
  Wallet,
  Plus,
  ExternalLink,
  Share2,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay, formatCurrency } from "@/components/shared/currency-display";
import { useAuth } from "@/hooks/use-auth";
import { PAYMENT_METHOD_LABELS, ORDER_STATUS_LABELS, PLATFORM_FEE_PERCENT } from "@/lib/constants";
import type { DashboardStats, Order } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/products?creator_id=${user?.id}`);
        const data = await res.json();
        // Build stats from mock data
        setStats({
          totalRevenue: user?.totalEarnings ?? 0,
          totalSales: user?.totalSales ?? 0,
          balance: user?.balance ?? 0,
          totalViews: user?.totalViews ?? 0,
          recentOrders: [],
          salesByDay: [],
        });
      } catch {
        // Use defaults
        setStats({
          totalRevenue: user?.totalEarnings ?? 0,
          totalSales: user?.totalSales ?? 0,
          balance: user?.balance ?? 0,
          totalViews: user?.totalViews ?? 0,
          recentOrders: [],
          salesByDay: [],
        });
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchStats();
    }
  }, [user?.id, user?.totalEarnings, user?.totalSales, user?.balance, user?.totalViews]);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-20 mb-2" />
                <div className="h-8 bg-muted rounded w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: stats.totalRevenue,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: "Total Sales",
      value: stats.totalSales,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      isCount: true,
    },
    {
      title: "Balance",
      value: stats.balance,
      icon: Wallet,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: "Total Views",
      value: stats.totalViews,
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      isCount: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Welcome back, {user?.displayName?.split(" ")[0] || "Creator"} 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s an overview of your store performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {stat.title}
                </p>
              </div>
              <div className="mt-3">
                {stat.isCount ? (
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value.toLocaleString()}
                  </p>
                ) : (
                  <CurrencyDisplay amount={stat.value} size="xl" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-auto py-3 justify-start"
          asChild
        >
          <Link href="/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-3 justify-start" asChild>
          <Link href={`/store/${user?.username || "demo"}`} target="_blank">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Store
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-3 justify-start" asChild>
          <Link href={`/store/${user?.username || "demo"}`}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Store Link
          </Link>
        </Button>
      </div>

      {/* Platform Fee Notice */}
      <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="p-4 flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Platform Fee: {PLATFORM_FEE_PERCENT}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You keep {100 - PLATFORM_FEE_PERCENT}% of every sale. Fees cover payment processing,
              hosting, and platform maintenance.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products">
                View all
                <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {stats.recentOrders.map((order: Order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{order.buyerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <CurrencyDisplay amount={order.amount} size="sm" />
                    <Badge
                      variant={
                        order.status === "completed"
                          ? "default"
                          : order.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                      className="ml-2 text-[10px]"
                    >
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No orders yet. Share your store link to start selling!
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href={`/store/${user?.username || "demo"}`} target="_blank">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  View Your Store
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
