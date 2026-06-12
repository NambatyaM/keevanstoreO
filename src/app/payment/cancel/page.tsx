// ============================================================
// Payment Cancel / Failed Page
// Enhanced with clear next-action guidance (conversion flow)
// ============================================================
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, RotateCcw, ArrowLeft, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const REASON_MESSAGES: Record<string, string> = {
  no_tracking_id: "No payment tracking information was received. This may be a temporary issue.",
  order_not_found: "We could not find your order. Please try again or contact support.",
  payment_failed: "Your payment was not completed successfully. Your card or mobile money account has not been charged.",
  status_check_failed: "We could not verify your payment status. If money was deducted, please contact support.",
  user_cancelled: "You cancelled the payment process. No charges were made.",
  server_error: "An error occurred while processing your payment. Please try again.",
};

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "payment_failed";

  const message =
    REASON_MESSAGES[reason] || "Your payment was not completed. No charges were made.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Cancel Icon */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 dark:bg-destructive/20 flex items-center justify-center mb-4">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Payment Cancelled
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your payment was not completed
          </p>
        </div>

        {/* Reason Card */}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground text-center">
              {message}
            </p>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                If you believe this is an error or if money was deducted from your account,
                please contact support. Your card has not been charged for this transaction.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions — Clear next steps */}
        <div className="space-y-3">
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => window.history.back()}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <Button variant="outline" className="w-full" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Stores
            </Link>
          </Button>
        </div>

        {/* Help text */}
        <p className="text-center text-xs text-muted-foreground">
          Need help?{" "}
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <Mail className="h-3 w-3" />
            Contact support
          </span>
        </p>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <RotateCcw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
