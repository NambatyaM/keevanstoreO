// ============================================================
// Shared Site Footer — Trust Links & Legal Pages
// WhatsApp support replacing email-based contact
// ============================================================
import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_URLS, WHATSAPP_DISPLAY } from "@/components/shared/whatsapp-support";

interface SiteFooterProps {
  /** Variant for different page contexts */
  variant?: "default" | "store";
  /** Creator display name (for store variant) */
  creatorName?: string;
  /** Creator username (for store variant back-link) */
  username?: string;
}

export function SiteFooter({ variant = "default", creatorName, username }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  if (variant === "store") {
    return (
      <footer className="border-t mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                Powered by{" "}
                <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Keevan Store
                </Link>
              </span>
              {creatorName && username && (
                <span>
                  <Link
                    href={`/store/${username}`}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Visit {creatorName}&apos;s store
                  </Link>
                </span>
              )}
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legal">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms & Conditions
              </Link>
              <a
                href={WHATSAPP_URLS.general}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <MessageCircle className="h-3 w-3" />
                WhatsApp Support
              </a>
            </nav>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            &copy; {currentYear} Keevan Store. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* Top row: Brand + Legal links */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2" aria-label="Keevan Store Home">
                <Image src="/logo-new.png" alt="Keevan Store" width={24} height={24} className="rounded-md" />
                <span className="text-sm font-medium text-foreground">Keevan Store</span>
              </Link>
            </div>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" aria-label="Footer navigation">
              <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms & Conditions
              </Link>
              <a
                href={WHATSAPP_URLS.general}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              >
                <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                WhatsApp Support
              </a>
            </nav>
          </div>

          {/* WhatsApp Support Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t pt-4">
            <a
              href={WHATSAPP_URLS.general}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              WhatsApp Support
            </a>
            <p className="text-sm font-medium text-foreground">
              {WHATSAPP_DISPLAY}
            </p>
            <p className="text-xs text-muted-foreground">
              Payments processed securely by Pesapal. All prices in UGX.
            </p>
          </div>

          {/* Bottom row: Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              &copy; {currentYear} Keevan Store. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
