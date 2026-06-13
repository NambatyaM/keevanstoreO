// ============================================================
// Custom Error Page — Global error boundary with WhatsApp support
// ============================================================
"use client";

import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, RefreshCw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WHATSAPP_URLS } from "@/components/shared/whatsapp-support";

const WHATSAPP_DISPLAY = "+256 768 345 905";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Error Icon */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Something Went Wrong
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            An unexpected error occurred. Please try again or contact support.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={reset}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <a href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </a>
          </Button>
        </div>

        {/* WhatsApp Support */}
        <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#25D366]/10 dark:bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Need Help?
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  WhatsApp Support: {WHATSAPP_DISPLAY}
                </p>
                <Button
                  size="sm"
                  className="mt-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white"
                  asChild
                >
                  <a
                    href={WHATSAPP_URLS.bug}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                    Report a Bug
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
