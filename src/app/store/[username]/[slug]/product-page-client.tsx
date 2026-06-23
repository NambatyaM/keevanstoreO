"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Download,
  Calendar,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  ShoppingCart,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay, formatCurrency } from "@/components/shared/currency-display";
import { CopyButton } from "@/components/shared/copy-button";
import { SiteFooter } from "@/components/shared/site-footer";
import { FloatingWhatsAppButton } from "@/components/shared/whatsapp-support";
import { PRODUCT_TYPE_LABELS } from "@/lib/constants";
import type { Creator, Product } from "@/types";
import { format } from "date-fns";
import { toast } from "sonner";

interface ProductPageClientProps {
  creator: Creator;
  product: Product;
  username: string;
  slug: string;
}

export function ProductPageClient({ creator, product, username, slug }: ProductPageClientProps) {
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");

  // Track page view
  useEffect(() => {
    if (creator?.id) {
      fetch("/api/page-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: creator.id,
          page: "product",
          referrer: document.referrer || "direct",
        }),
      }).catch(() => {});
    }
  }, [creator?.id]);

  const handlePurchase = async () => {
    if (!buyerEmail || !buyerName) {
      toast.error("Please fill in your name and email");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          buyerEmail,
          buyerName,
          paymentMethod: "card", // Default to card, Pesapal will show all options
          donationAmount: donationAmount ? parseInt(donationAmount) : 0,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.paymentUrl) {
        window.location.href = data.data.paymentUrl;
      } else {
        toast.error(data.error || "Payment failed. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isEvent = product.type === "event";
  const productUrl = typeof window !== "undefined"
    ? window.location.href
    : `/store/${username}/${slug}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Bar */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <a
            href={`/store/${username}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>@{username}</span>
          </a>
          <CopyButton text={productUrl} label="Share" size="sm" />
        </div>
      </div>

      {/* Product Content */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Product Image */}
          <div className="aspect-square rounded-xl overflow-hidden bg-muted">
            {product.thumbnailUrl ? (
              <img
                src={product.thumbnailUrl}
                alt={`${product.title} by ${creator.displayName}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                {isEvent ? (
                  <Calendar className="h-20 w-20 text-emerald-300" aria-hidden="true" />
                ) : (
                  <Download className="h-20 w-20 text-emerald-300" aria-hidden="true" />
                )}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <div>
              <Badge
                variant={isEvent ? "default" : "secondary"}
                className={`mb-2 ${isEvent ? "bg-emerald-600 text-white" : ""}`}
              >
                {isEvent ? (
                  <Calendar className="h-3 w-3 mr-1" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                {PRODUCT_TYPE_LABELS[product.type]}
              </Badge>
              <h1 className="text-2xl font-bold text-foreground">
                {product.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                by{" "}
                <a
                  href={`/store/${username}`}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {creator.displayName}
                </a>
              </p>
            </div>

            {/* Price — clearly labeled, above the fold */}
            <div className="py-2">
              <CurrencyDisplay amount={product.price} size="xl" />
              <p className="text-xs text-muted-foreground mt-1">
                {isEvent ? "Per ticket" : "One-time purchase"} — Instant delivery after payment
              </p>
            </div>

            {/* What you get — scannable info for AEO */}
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>{isEvent ? "Event ticket with QR code" : "Instant digital download"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>Secure payment via Pesapal</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>Delivery by email</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {/* Event-specific info */}
            {isEvent && (
              <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                {product.venue && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span>{product.venue}</span>
                  </div>
                )}
                {product.eventDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    <span>{format(new Date(product.eventDate), "EEEE, MMMM d, yyyy")}</span>
                  </div>
                )}
                {product.eventDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span>{format(new Date(product.eventDate), "h:mm a")}</span>
                  </div>
                )}
                {product.capacity && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <span>
                      {product.ticketsSold} / {product.capacity} tickets sold
                      {" "}({product.capacity - product.ticketsSold} remaining)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Buy Button */}
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
              onClick={() => document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {isEvent ? (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Get Ticket — {formatCurrency(product.price)}
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Buy Now — {formatCurrency(product.price)}
                </>
              )}
            </Button>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Secure Payment
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Mobile Money
              </span>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter variant="store" creatorName={creator.displayName} username={username} />
      <FloatingWhatsAppButton />

      {/* Inline Checkout Section */}
      <div id="checkout-section" className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <h2 className="text-xl font-bold">Complete Your Purchase</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buyerName">Full Name</Label>
              <Input
                id="buyerName"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerEmail">Email Address</Label>
              <Input
                id="buyerEmail"
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="your@email.com"
              />
              <p className="text-xs text-muted-foreground">
                {isEvent
                  ? "Ticket and QR code will be sent to this email"
                  : "Download link will be sent to this email (valid for 24 hours)"}
              </p>
            </div>

            {/* Donation Option */}
            {creator.donationsEnabled && (
              <div className="space-y-2">
                <Label htmlFor="donationAmount">Add a donation (optional)</Label>
                <Input
                  id="donationAmount"
                  type="number"
                  min="0"
                  placeholder="Enter amount (UGX)"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Support {creator.displayName} with an additional donation
                </p>
              </div>
            )}

            {/* Order Summary */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Product</span>
                <span className="font-medium">{product.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price</span>
                <span>{formatCurrency(product.price)}</span>
              </div>
              {donationAmount && parseInt(donationAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Donation</span>
                  <span>{formatCurrency(parseInt(donationAmount))}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(product.price + (donationAmount ? parseInt(donationAmount) : 0))}</span>
              </div>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
              onClick={handlePurchase}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay {formatCurrency(product.price + (donationAmount ? parseInt(donationAmount) : 0))}</>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You will be redirected to Pesapal to complete your payment securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
