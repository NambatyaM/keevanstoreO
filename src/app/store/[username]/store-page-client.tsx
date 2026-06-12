"use client";

import { useEffect } from "react";
import Link from "next/link";
import { StoreHero } from "@/components/store/store-hero";
import { ProductCard } from "@/components/store/product-card";
import { DonationWidget } from "@/components/store/donation-widget";
import { Package, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/shared/site-footer";
import { FloatingWhatsAppButton } from "@/components/shared/whatsapp-support";
import type { Creator, Product } from "@/types";

interface StorePageClientProps {
  creator: Creator;
  products: Product[];
  username: string;
}

export function StorePageClient({ creator, products, username }: StorePageClientProps) {
  // Track page view
  useEffect(() => {
    if (creator?.id) {
      fetch("/api/page-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: creator.id,
          page: "store",
          referrer: document.referrer || "direct",
        }),
      }).catch(() => {});
    }
  }, [creator?.id]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero / Profile */}
      <StoreHero creator={creator} />

      {/* Content */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* FAQ for AEO */}
        <section className="mb-8" aria-label="Frequently asked questions">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            How {creator.displayName}&apos;s Store Works
          </h2>
          <div className="space-y-2">
            <details className="border rounded-lg p-3">
              <summary className="cursor-pointer text-sm font-medium text-foreground">
                How do I buy a digital product from {creator.displayName}?
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Browse the products listed above, click &quot;Buy Now&quot; on the one you want,
                enter your name and email, choose a payment method (MTN Mobile Money, Airtel Money,
                bank transfer, or card), and complete the payment. You will receive a download link
                by email within minutes.
              </p>
            </details>
            <details className="border rounded-lg p-3">
              <summary className="cursor-pointer text-sm font-medium text-foreground">
                What payment methods does {creator.displayName} accept?
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                {creator.displayName} accepts MTN Mobile Money, Airtel Money, bank transfer, and
                card payments. All payments are processed securely through Pesapal.
              </p>
            </details>
            <details className="border rounded-lg p-3">
              <summary className="cursor-pointer text-sm font-medium text-foreground">
                How long does delivery take?
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Digital products are delivered instantly after payment. You will receive a download
                link by email that is valid for 24 hours. Event tickets include a QR code sent to
                your email for check-in at the event.
              </p>
            </details>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Products ({products.length})
              </h2>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    creatorUsername={username}
                    variant="public"
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-foreground">No products available yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check back soon for new products from {creator.displayName}!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Donations */}
          <div className="space-y-4">
            {creator.donationsEnabled && (
              <DonationWidget creator={creator} />
            )}

            {/* Back to Keevan Store link */}
            <Card>
              <CardContent className="p-4">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/">
                    <ChevronRight className="h-3.5 w-3.5 mr-1 rotate-180" />
                    Create Your Own Store
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SiteFooter variant="store" creatorName={creator.displayName} username={username} />
      <FloatingWhatsAppButton />
    </div>
  );
}
