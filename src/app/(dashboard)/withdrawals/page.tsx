// ============================================================
// Withdrawals Page
// ============================================================
"use client";

import { useState } from "react";
import {
  Wallet,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyDisplay, formatCurrency } from "@/components/shared/currency-display";
import { useAuth } from "@/hooks/use-auth";
import { MIN_WITHDRAWAL_AMOUNT, WITHDRAWAL_STATUS_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import type { Withdrawal, WithdrawalStatus } from "@/types";

const mockWithdrawals: Withdrawal[] = [
  {
    id: "wd-1",
    creatorId: "creator-1",
    amount: 200000,
    status: "completed" as WithdrawalStatus,
    phoneNumber: "256700000001",
    provider: "MTN Mobile Money",
    createdAt: "2026-02-20T10:00:00Z",
    processedAt: "2026-02-20T12:00:00Z",
  },
  {
    id: "wd-2",
    creatorId: "creator-1",
    amount: 300000,
    status: "pending" as WithdrawalStatus,
    phoneNumber: "256700000001",
    provider: "Airtel Money",
    createdAt: "2026-03-01T08:00:00Z",
    processedAt: null,
  },
  {
    id: "wd-3",
    creatorId: "creator-1",
    amount: 150000,
    status: "processing" as WithdrawalStatus,
    phoneNumber: "256700000001",
    provider: "MTN Mobile Money",
    createdAt: "2026-03-02T09:00:00Z",
    processedAt: null,
  },
];

function getStatusIcon(status: WithdrawalStatus) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "processing":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

export default function WithdrawalsPage() {
  const { user } = useAuth();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestWithdrawal = async () => {
    const withdrawalAmount = parseInt(amount);

    if (!withdrawalAmount || withdrawalAmount < MIN_WITHDRAWAL_AMOUNT) {
      toast.error(`Minimum withdrawal is ${formatCurrency(MIN_WITHDRAWAL_AMOUNT)}`);
      return;
    }

    if (!phoneNumber) {
      toast.error("Phone number is required");
      return;
    }

    if (!provider) {
      toast.error("Please select a provider");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Withdrawal request submitted!");
    setShowNewDialog(false);
    setAmount("");
    setPhoneNumber("");
    setProvider("");
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Withdrawals</h2>
          <p className="text-sm text-muted-foreground">
            Withdraw your earnings to mobile money
          </p>
        </div>

        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-1.5" />
              Request Withdrawal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Withdrawal</DialogTitle>
              <DialogDescription>
                Withdraw your earnings to your mobile money account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Available Balance</Label>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(user?.balance ?? 0)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wd-amount">Amount (UGX)</Label>
                <Input
                  id="wd-amount"
                  type="number"
                  min={MIN_WITHDRAWAL_AMOUNT}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Minimum ${formatCurrency(MIN_WITHDRAWAL_AMOUNT)}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wd-provider">Provider</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                    <SelectItem value="airtel">Airtel Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wd-phone">Phone Number</Label>
                <Input
                  id="wd-phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="256700000000"
                />
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleRequestWithdrawal}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit Withdrawal Request"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Balance Card */}
      <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <CurrencyDisplay amount={user?.balance ?? 0} size="xl" />
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Earnings</p>
            <CurrencyDisplay amount={user?.totalEarnings ?? 0} size="lg" />
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          {mockWithdrawals.length > 0 ? (
            <div className="space-y-3">
              {mockWithdrawals.map((wd) => (
                <div
                  key={wd.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(wd.status)}
                    <div>
                      <p className="text-sm font-medium">
                        {formatCurrency(wd.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {wd.provider} &middot; {wd.phoneNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        wd.status === "completed"
                          ? "default"
                          : wd.status === "pending"
                          ? "secondary"
                          : wd.status === "processing"
                          ? "outline"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {WITHDRAWAL_STATUS_LABELS[wd.status]}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(wd.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No withdrawal history yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
