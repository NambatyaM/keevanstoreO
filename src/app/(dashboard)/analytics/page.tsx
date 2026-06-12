// ============================================================
// Analytics Page — Enhanced with date range filter & product table
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  Eye,
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CurrencyDisplay, formatCurrency } from "@/components/shared/currency-display";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface AnalyticsData {
  totalRevenue: number;
  totalSales: number;
  totalViews: number;
  conversionRate: number;
  salesByDay: { date: string; sales: number; revenue: number; views: number }[];
  topProducts: {
    name: string;
    sales: number;
    revenue: number;
    views: number;
    conversionRate: number;
  }[];
  revenueChange: number;
  salesChange: number;
  viewsChange: number;
}

type DateRange = "7d" | "30d" | "90d" | "all";

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "all", label: "All Time" },
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>("30d");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics?creator_id=${user.id}&range=${range}`
      );
      const data = await res.json();
      if (data.success && data.data) {
        setAnalytics(data.data);
      }
    } catch {
      // Failed to fetch analytics
    } finally {
      setLoading(false);
    }
  }, [user?.id, range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const summaryStats = [
    {
      title: `Revenue (${range === "all" ? "All" : range.replace("d", "d")})`,
      value: analytics?.totalRevenue ?? 0,
      change: analytics?.revenueChange ?? 0,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: `Sales (${range === "all" ? "All" : range.replace("d", "d")})`,
      value: analytics?.totalSales ?? 0,
      change: analytics?.salesChange ?? 0,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      isCount: true,
    },
    {
      title: `Views (${range === "all" ? "All" : range.replace("d", "d")})`,
      value: analytics?.totalViews ?? 0,
      change: analytics?.viewsChange ?? 0,
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      isCount: true,
    },
    {
      title: "Conversion Rate",
      value: analytics?.conversionRate ?? 0,
      change: 0,
      icon: TrendingUp,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      isPercent: true,
    },
  ];

  // Format chart data
  const chartData = (analytics?.salesByDay ?? []).map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    sales: d.sales,
    revenue: d.revenue,
    views: d.views,
  }));

  if (loading && !analytics) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track your store performance
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {DATE_RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={range === option.value ? "default" : "ghost"}
              size="sm"
              className={`text-xs h-8 px-3 ${
                range === option.value
                  ? "bg-background shadow-sm"
                  : ""
              }`}
              onClick={() => setRange(option.value)}
              disabled={loading}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryStats.map((stat) => {
          const isUp = stat.change >= 0;
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                  >
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {stat.title}
                  </p>
                </div>
                <div className="mt-3 flex items-end gap-2">
                  {stat.isPercent ? (
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}%
                    </p>
                  ) : stat.isCount ? (
                    <p className="text-2xl font-bold text-foreground">
                      {(stat.value as number).toLocaleString()}
                    </p>
                  ) : (
                    <CurrencyDisplay
                      amount={stat.value as number}
                      size="xl"
                    />
                  )}
                  {stat.change !== 0 && (
                    <span
                      className={`text-xs font-medium flex items-center mb-1 ${
                        isUp ? "text-emerald-600" : "text-destructive"
                      }`}
                    >
                      {isUp ? (
                        <ArrowUpRight className="h-3 w-3 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      )}
                      {Math.abs(stat.change)}%
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="views">Views</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        interval={4}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={(val) =>
                          `${(val / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          formatCurrency(value),
                          "Revenue",
                        ]}
                        labelStyle={{ fontSize: 12 }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        interval={4}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="views">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Page Views Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        interval={4}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Per-Product Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.topProducts && analytics.topProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Conversion %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topProducts.map((product, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.views.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.sales}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-medium ${
                          product.conversionRate >= 3
                            ? "text-emerald-600"
                            : product.conversionRate >= 1.5
                            ? "text-amber-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {product.conversionRate}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No product data available
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
