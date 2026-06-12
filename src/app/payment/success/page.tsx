// ============================================================
// Payment Success Page
// Enhanced with clear next actions (conversion flow)
// ============================================================
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  Mail,
  Ticket,
  ArrowLeft,
  QrCode,
  Loader2,
  ExternalLink,
  FileText,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { WhatsAppSupportCard } from "@/components/shared/whatsapp-support";
import type { Order, Product, Creator } from "@/types";

interface DownloadSessionInfo {
  id: string;
  productId: string;
  productName: string;
  productThumbnail: string | null;
  fileName: string | null;
  fileSize: number | null;
  creatorName: string;
  expiresAt: string;
  downloadCount: number;
  maxDownloads: number;
  remainingDownloads: number;
  createdAt: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const trackingId = searchParams.get("trackingId");
  const downloadTokenParam = searchParams.get("downloadToken");

  const [order, setOrder] = useState<Order | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [downloadSession, setDownloadSession] = useState<DownloadSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setOrder(data.data);

          // Fetch product details
          const prodRes = await fetch(`/api/products/${data.data.productId}`);
          const prodData = await prodRes.json();
          if (prodData.success && prodData.data) {
            setProduct(prodData.data);

            // If digital product, try to fetch download session info
            if (prodData.data.type === "digital" && downloadTokenParam) {
              const dlRes = await fetch(`/api/download/${downloadTokenParam}`);
              const dlData = await dlRes.json();
              if (dlData.success && dlData.data) {
                setDownloadSession(dlData.data);
              }
            }

            // Fetch creator details
            const storeRes = await fetch(`/api/store?creator_id=${data.data.creatorId}`);
            const storeData = await storeRes.json();
            if (storeData.success && storeData.data) {
              setCreator(storeData.data.creator || storeData.data);
            }
          }
        }
      } catch (err) {
        console.error("Order fetch failed:", err);
        setError("Failed to load order details. Your payment may still be processing.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, downloadTokenParam]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Confirming payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isDigital = product?.type === "digital";
  const isEvent = product?.type === "event";

  // Determine download URL
  const downloadUrl = downloadTokenParam
    ? `/download/${downloadTokenParam}`
    : order?.downloadToken
      ? `/download/${order.downloadToken}`
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Success Icon */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Payment Successful!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your payment has been processed successfully
          </p>
        </div>

        {/* Order Summary */}
        {order && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Order ID</span>
                <span className="text-sm font-medium font-mono">
                  {order.id}
                </span>
              </div>

              {product && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Product</span>
                  <span className="text-sm font-medium">{product.title}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <CurrencyDisplay amount={order.amount} size="md" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant={
                    order.status === "completed" ? "default" : "secondary"
                  }
                  className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                >
                  {order.status === "completed" ? "Completed" : "Processing"}
                </Badge>
              </div>

              {trackingId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Tracking ID
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {trackingId}
                  </span>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Buyer</span>
                  <span className="text-sm font-medium">{order.buyerName}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Digital Product - Download Section */}
        {isDigital && (
          <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Your Digital Product is Ready!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {product?.fileName && (
                      <span className="font-medium">{product.fileName}</span>
                    )}
                    {product?.fileSize && (
                      <span className="ml-1">
                        ({(product.fileSize / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {downloadSession && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Expires in 24h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{downloadSession.remainingDownloads} of {downloadSession.maxDownloads} downloads left</span>
                  </div>
                </div>
              )}

              {downloadUrl && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  asChild
                >
                  <Link href={downloadUrl}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Now
                  </Link>
                </Button>
              )}

              {!downloadUrl && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Check your email ({order?.buyerEmail}) for the download link.
                    The link will be valid for 24 hours.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Event Product - Ticket Info */}
        {isEvent && (
          <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Ticket className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Your Ticket
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your ticket has been confirmed. Check your email for the
                    ticket and QR code. Show the QR code at the event entrance for check-in.
                  </p>
                </div>
              </div>

              {product?.venue && (
                <div className="flex items-start gap-3">
                  <QrCode className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {product.venue}
                    </p>
                    {product.eventDate && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(product.eventDate).toLocaleDateString(
                          "en-UG",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* No Order Found */}
        {!order && !loading && (
          <>
            <WhatsAppSupportCard
              title="Having trouble accessing your purchase?"
              description="Contact Keevan Store Support"
              buttons={[
                { label: "Get Help on WhatsApp", variant: "payment" },
              ]}
              compact
            />
            <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Confirmation Email Sent
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your payment was successful. You will receive a confirmation
                      email with your order details shortly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Next Actions — Conversion Flow */}
        <div className="space-y-3">
          {/* Primary: Visit creator's store */}
          {creator && !isDigital && (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              asChild
            >
              <Link href={`/store/${creator.username}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit {creator.displayName}&apos;s Store
              </Link>
            </Button>
          )}

          {/* Secondary: Back to home / browse */}
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse More Stores
            </Link>
          </Button>

          {/* Tertiary: Become a creator */}
          <p className="text-center text-xs text-muted-foreground">
            Want to sell your own products?{" "}
            <Link href="/signup" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Create your free store
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
