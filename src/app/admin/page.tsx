// ============================================================
// Admin Dashboard Page — Enhanced with Tabs
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  ArrowLeft,
  Check,
  X,
  Shield,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CurrencyDisplay, formatCurrency } from "@/components/shared/currency-display";
import { mockCreators, mockProducts, mockOrders, mockWithdrawals, mockDonations } from "@/lib/mock-data";
import { ORDER_STATUS_LABELS, WITHDRAWAL_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import type { Order, WithdrawalStatus } from "@/types";

// Track admin state locally
interface CreatorAdminState {
  active: boolean;
  verified: boolean;
}

const creatorAdminStates: Record<string, CreatorAdminState> = {};
mockCreators.forEach((c) => {
  creatorAdminStates[c.id] = { active: true, verified: false };
});

export default function AdminPage() {
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [withdrawals, setWithdrawals] = useState(mockWithdrawals.map(w => ({ ...w })));
  const [creatorStates, setCreatorStates] = useState<Record<string, CreatorAdminState>>({ ...creatorAdminStates });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const totalRevenue = mockOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.amount, 0);

  const totalFees = mockOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.platformFee, 0);

  // Filter orders by status
  const filteredOrders =
    orderFilter === "all"
      ? mockOrders
      : mockOrders.filter((o) => o.status === orderFilter);

  // Handle creator toggle
  const handleCreatorAction = useCallback(
    async (creatorId: string, action: string) => {
      setActionLoading(`${creatorId}-${action}`);
      try {
        const res = await fetch("/api/admin/creators", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorId, action }),
        });
        const data = await res.json();
        if (data.success) {
          setCreatorStates((prev) => ({
            ...prev,
            [creatorId]: {
              active:
                action === "activate"
                  ? true
                  : action === "deactivate"
                  ? false
                  : prev[creatorId]?.active ?? true,
              verified:
                action === "verify"
                  ? true
                  : action === "unverify"
                  ? false
                  : prev[creatorId]?.verified ?? false,
            },
          }));
          toast.success(`Creator ${action}d successfully`);
        } else {
          toast.error(data.error || "Action failed");
        }
      } catch {
        toast.error("Failed to update creator");
      } finally {
        setActionLoading(null);
      }
    },
    []
  );

  // Handle withdrawal approve/reject
  const handleWithdrawalAction = useCallback(
    async (withdrawalId: string, action: "approve" | "reject") => {
      setActionLoading(`${withdrawalId}-${action}`);
      try {
        const res = await fetch("/api/admin/withdrawals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ withdrawalId, action }),
        });
        const data = await res.json();
        if (data.success) {
          setWithdrawals((prev) =>
            prev.map((w) =>
              w.id === withdrawalId
                ? {
                    ...w,
                    status: (action === "approve" ? "approved" : "rejected") as import("@/types").WithdrawalStatus,
                    processedAt: new Date().toISOString(),
                  }
                : w
            )
          );
          toast.success(
            `Withdrawal ${action === "approve" ? "approved" : "rejected"} successfully`
          );
        } else {
          toast.error(data.error || "Action failed");
        }
      } catch {
        toast.error("Failed to update withdrawal");
      } finally {
        setActionLoading(null);
      }
    },
    []
  );

  // Get creator name by ID
  const getCreatorName = (creatorId: string) => {
    const creator = mockCreators.find((c) => c.id === creatorId);
    return creator?.displayName || "Unknown";
  };

  // Get product name by ID
  const getProductName = (productId: string) => {
    const product = mockProducts.find((p) => p.id === productId);
    return product?.title || productId;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Platform overview and management
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs text-muted-foreground">Creators</p>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {mockCreators.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {mockProducts.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                  <p className="text-xs text-muted-foreground">Total GMV</p>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(totalRevenue)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <p className="text-xs text-muted-foreground">
                    Platform Fees
                  </p>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(totalFees)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Top Creators by Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockCreators
                    .sort(
                      (a, b) => b.totalEarnings - a.totalEarnings
                    )
                    .map((creator) => (
                      <div
                        key={creator.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {creator.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{creator.username}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(creator.totalEarnings)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {creator.totalSales} sales
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockOrders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {order.buyerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getProductName(order.productId)}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="text-sm font-medium">
                            {formatCurrency(order.amount)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            order.status === "completed"
                              ? "default"
                              : order.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Creators Tab ── */}
        <TabsContent value="creators">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Creators</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Username
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Email
                    </TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">
                      Sales
                    </TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Verified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCreators.map((creator) => {
                    const state = creatorStates[creator.id];
                    const isActive = state?.active ?? true;
                    const isVerified = state?.verified ?? false;

                    return (
                      <TableRow key={creator.id}>
                        <TableCell className="font-medium">
                          {creator.displayName}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          @{creator.username}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {creator.email}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(creator.totalEarnings)}
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell">
                          {creator.totalSales}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={isActive ? "default" : "secondary"}
                            className={
                              isActive
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : ""
                            }
                          >
                            {isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {isVerified ? (
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 gap-1">
                              <Shield className="h-3 w-3" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Unverified
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() =>
                                handleCreatorAction(
                                  creator.id,
                                  isActive ? "deactivate" : "activate"
                                )
                              }
                              disabled={actionLoading === `${creator.id}-${isActive ? "deactivate" : "activate"}`}
                            >
                              {actionLoading === `${creator.id}-${isActive ? "deactivate" : "activate"}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : isActive ? (
                                "Deactivate"
                              ) : (
                                "Activate"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() =>
                                handleCreatorAction(
                                  creator.id,
                                  isVerified ? "unverify" : "verify"
                                )
                              }
                              disabled={actionLoading === `${creator.id}-${isVerified ? "unverify" : "verify"}`}
                            >
                              {actionLoading === `${creator.id}-${isVerified ? "unverify" : "verify"}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : isVerified ? (
                                "Unverify"
                              ) : (
                                "Verify"
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Withdrawals Tab ── */}
        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Pending Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawals.filter((w) => w.status === "pending").length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Method
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Phone
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Requested
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals
                      .filter((w) => w.status === "pending")
                      .map((wd) => (
                        <TableRow key={wd.id}>
                          <TableCell className="font-medium">
                            {getCreatorName(wd.creatorId)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(wd.amount)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {wd.provider}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {wd.phoneNumber}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                            {new Date(wd.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                onClick={() =>
                                  handleWithdrawalAction(wd.id, "approve")
                                }
                                disabled={actionLoading === `${wd.id}-approve`}
                              >
                                {actionLoading === `${wd.id}-approve` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="h-3 w-3 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  handleWithdrawalAction(wd.id, "reject")
                                }
                                disabled={actionLoading === `${wd.id}-reject`}
                              >
                                {actionLoading === `${wd.id}-reject` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <X className="h-3 w-3 mr-1" />
                                    Reject
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No pending withdrawals
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Withdrawals */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">All Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Provider
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((wd) => (
                    <TableRow key={wd.id}>
                      <TableCell className="font-medium">
                        {getCreatorName(wd.creatorId)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(wd.amount)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {wd.provider}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            wd.status === "completed" || wd.status === "approved"
                              ? "default"
                              : wd.status === "pending"
                              ? "secondary"
                              : wd.status === "processing"
                              ? "outline"
                              : "destructive"
                          }
                          className={
                            wd.status === "completed" || wd.status === "approved"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : ""
                          }
                        >
                          {WITHDRAWAL_STATUS_LABELS[wd.status as keyof typeof WITHDRAWAL_STATUS_LABELS] || wd.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                        {new Date(wd.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Orders Tab ── */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-base">All Orders</CardTitle>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  {["all", "completed", "pending", "failed"].map((filter) => (
                    <Button
                      key={filter}
                      variant={orderFilter === filter ? "default" : "ghost"}
                      size="sm"
                      className={`text-xs h-7 px-3 ${
                        orderFilter === filter
                          ? "bg-background shadow-sm"
                          : ""
                      }`}
                      onClick={() => setOrderFilter(filter)}
                    >
                      {filter === "all"
                        ? "All"
                        : ORDER_STATUS_LABELS[filter] || filter}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyer</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Product
                    </TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right hidden md:table-cell">
                      Fee
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Creator
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {order.buyerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.buyerEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {getProductName(order.productId)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.amount)}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell text-muted-foreground">
                        {formatCurrency(order.platformFee)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {getCreatorName(order.creatorId)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.status === "completed"
                              ? "default"
                              : order.status === "pending"
                              ? "secondary"
                              : order.status === "refunded"
                              ? "outline"
                              : "destructive"
                          }
                          className={
                            order.status === "completed"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : ""
                          }
                        >
                          {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
