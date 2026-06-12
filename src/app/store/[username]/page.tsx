// ============================================================
// Public Store Page — /store/[username]
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StoreHero } from "@/components/store/store-hero";
import { ProductCard } from "@/components/store/product-card";
import { DonationWidget } from "@/components/store/donation-widget";
import { Loader2, Store, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Creator, Product } from "@/types";

export default function PublicStorePage() {
  const params = useParams();
  const username = params.username as string;

  const [creator, setCreator] = useState<Creator | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchStore() {
      try {
        const res = await fetch(`/api/store?username=${encodeURIComponent(username)}`);
        const data = await res.json();

        if (data.success && data.data) {
          setCreator(data.data.creator || data.data);
          setProducts(data.data.products || []);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchStore();
  }, [username]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (notFound || !creator) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground">Store Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The store &quot;@{username}&quot; doesn&apos;t exist or has been deactivated.
            </p>
            <a
              href="/"
              className="inline-block mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Go to Keevan Store
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero / Profile */}
      <StoreHero creator={creator} />

      {/* Content */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
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
                  <p className="text-sm text-muted-foreground">
                    No products available yet. Check back soon!
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
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <a href="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Keevan Store
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
