// ============================================================
// WhatsApp Support Components — Unified support via WhatsApp
// Phone: +256 768 345 905
// ============================================================
"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ── WhatsApp URL Constants ─────────────────────────────────
const WHATSAPP_PHONE = "256768345905";
const WHATSAPP_DISPLAY = "+256 768 345 905";

export const WHATSAPP_URLS = {
  general: `https://wa.me/${WHATSAPP_PHONE}?text=Hello%20Keevan%20Store,%20I%20need%20assistance.`,
  withdrawal: `https://wa.me/${WHATSAPP_PHONE}?text=Hello%20Keevan%20Store,%20I%20would%20like%20to%20request%20a%20withdrawal.`,
  payment: `https://wa.me/${WHATSAPP_PHONE}?text=Hello%20Keevan%20Store,%20I%20have%20a%20payment%20issue.`,
  download: `https://wa.me/${WHATSAPP_PHONE}?text=Hello%20Keevan%20Store,%20I%20cannot%20download%20my%20product.`,
  creator: `https://wa.me/${WHATSAPP_PHONE}?text=Hello%20Keevan%20Store,%20I%20need%20creator%20support.`,
  bug: `https://wa.me/${WHATSAPP_PHONE}?text=Hello%20Keevan%20Store,%20I%20would%20like%20to%20report%20a%20bug.`,
};

// ── Floating WhatsApp Button ───────────────────────────────
// Fixed-position button in bottom-right corner
interface FloatingWhatsAppButtonProps {
  /** Which WhatsApp URL to use. Defaults to "general" */
  variant?: "general" | "withdrawal" | "payment" | "download" | "creator" | "bug";
  /** Custom URL override (takes priority over variant) */
  url?: string;
}

export function FloatingWhatsAppButton({ variant = "general", url }: FloatingWhatsAppButtonProps) {
  const href = url || WHATSAPP_URLS[variant];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ebe5a] hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}

// ── WhatsApp Support Card ──────────────────────────────────
// Used on dashboard, withdrawal, and other pages
interface WhatsAppSupportCardProps {
  /** Title text. Defaults to "Need Help?" */
  title?: string;
  /** Description text */
  description?: string;
  /** Buttons to show. Defaults to ["general"] */
  buttons?: Array<{
    label: string;
    variant: "general" | "withdrawal" | "payment" | "download" | "creator" | "bug";
  }>;
  /** Compact mode (less padding) */
  compact?: boolean;
}

export function WhatsAppSupportCard({
  title = "Need Help?",
  description = "Contact Keevan Store Support",
  buttons = [{ label: "Contact Support", variant: "general" }],
  compact = false,
}: WhatsAppSupportCardProps) {
  return (
    <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#25D366]/10 dark:bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
            <p className="text-sm font-medium text-foreground mt-2">
              WhatsApp: {WHATSAPP_DISPLAY}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {buttons.map((btn) => (
                <Button
                  key={btn.variant}
                  size="sm"
                  className="bg-[#25D366] hover:bg-[#1ebe5a] text-white"
                  asChild
                >
                  <a
                    href={WHATSAPP_URLS[btn.variant]}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                    {btn.label}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Inline WhatsApp Link ───────────────────────────────────
// Inline text link for support sections
interface WhatsAppLinkProps {
  /** Which WhatsApp URL to use */
  variant?: "general" | "withdrawal" | "payment" | "download" | "creator" | "bug";
  /** Display text. Defaults to "Contact Support on WhatsApp" */
  children?: React.ReactNode;
  /** Custom URL override */
  url?: string;
  className?: string;
}

export function WhatsAppLink({
  variant = "general",
  children,
  url,
  className = "text-[#25D366] hover:text-[#1ebe5a] font-medium inline-flex items-center gap-1.5",
}: WhatsAppLinkProps) {
  const href = url || WHATSAPP_URLS[variant];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <MessageCircle className="h-3.5 w-3.5" />
      {children || "Contact Support on WhatsApp"}
    </a>
  );
}

// ── WhatsApp Support Section ───────────────────────────────
// For error pages and standalone support sections
interface WhatsAppSupportSectionProps {
  /** Heading text */
  title?: string;
  /** Description text */
  message?: string;
  /** Button label */
  buttonLabel?: string;
  /** Which WhatsApp URL variant */
  variant?: "general" | "withdrawal" | "payment" | "download" | "creator" | "bug";
}

export function WhatsAppSupportSection({
  title = "Need Help?",
  message = "Contact Keevan Store Support on WhatsApp",
  buttonLabel = "Get Help on WhatsApp",
  variant = "general",
}: WhatsAppSupportSectionProps) {
  return (
    <div className="text-center space-y-2">
      <p className="text-sm text-muted-foreground">
        {title}
      </p>
      <p className="text-sm font-medium text-foreground">
        {message}
      </p>
      <p className="text-sm text-muted-foreground">
        {WHATSAPP_DISPLAY}
      </p>
      <Button
        className="bg-[#25D366] hover:bg-[#1ebe5a] text-white"
        asChild
      >
        <a
          href={WHATSAPP_URLS[variant]}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          {buttonLabel}
        </a>
      </Button>
    </div>
  );
}
