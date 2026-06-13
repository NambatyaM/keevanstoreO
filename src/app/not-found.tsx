// ============================================================
// Custom 404 Not Found Page — Branded with WhatsApp support
// ============================================================
import Link from "next/link";
import { ArrowLeft, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WHATSAPP_URLS } from "@/components/shared/whatsapp-support";

const WHATSAPP_DISPLAY = "+256 768 345 905";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6">
        {/* 404 Icon */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <p className="text-lg font-medium text-foreground mt-2">
            Page Not Found
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            asChild
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/store/sarah-creates">
              View Demo Store
            </Link>
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
                    href={WHATSAPP_URLS.general}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                    Chat on WhatsApp
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
