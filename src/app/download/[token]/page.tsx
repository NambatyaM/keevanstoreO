// ============================================================
// Download Page — Secure file download delivery
// ============================================================
"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Download,
  FileText,
  Clock,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowLeft,
  Package,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

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

type ErrorState = "expired" | "max_downloads" | "invalid" | "server_error" | null;

function formatTimeRemaining(expiresAt: string): string {
  const now = new Date().getTime();
  const expires = new Date(expiresAt).getTime();
  const diff = expires - now;

  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function DownloadPageContent() {
  const params = useParams();
  const token = (params?.token as string) || "";

  const [sessionInfo, setSessionInfo] = useState<DownloadSessionInfo | null>(null);
  const [error, setError] = useState<ErrorState>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [currentDownloadCount, setCurrentDownloadCount] = useState(0);

  // Fetch session info
  const fetchSessionInfo = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/download/${token}`);
      const data = await res.json();

      if (!data.success) {
        if (res.status === 410 || data.error?.includes("expired")) {
          setError("expired");
        } else if (res.status === 429 || data.error?.includes("Maximum")) {
          setError("max_downloads");
        } else if (res.status === 404 || data.error?.includes("Invalid")) {
          setError("invalid");
        } else {
          setError("server_error");
        }
        setLoading(false);
        return;
      }

      setSessionInfo(data.data);
      setCurrentDownloadCount(data.data.downloadCount);
      setLoading(false);
    } catch {
      setError("server_error");
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSessionInfo();
  }, [fetchSessionInfo]);

  // Countdown timer
  useEffect(() => {
    if (!sessionInfo) return;

    const updateTimer = () => {
      const remaining = formatTimeRemaining(sessionInfo.expiresAt);
      setTimeRemaining(remaining);

      if (new Date(sessionInfo.expiresAt) <= new Date()) {
        setError("expired");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sessionInfo]);

  // Handle download
  const handleDownload = async () => {
    if (!token) return;

    setDownloading(true);
    try {
      const res = await fetch(`/api/download/${token}?action=download`);
      const data = await res.json();

      if (!data.success) {
        if (res.status === 410 || data.error?.includes("expired")) {
          setError("expired");
        } else if (res.status === 429 || data.error?.includes("Maximum")) {
          setError("max_downloads");
        } else {
          setError("server_error");
        }
        setDownloading(false);
        return;
      }

      // Open download URL in new tab
      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      }

      setCurrentDownloadCount(data.downloadCount || currentDownloadCount + 1);
      setDownloadComplete(true);

      // Reset download complete after 3 seconds
      setTimeout(() => setDownloadComplete(false), 3000);
    } catch {
      setError("server_error");
    } finally {
      setDownloading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="text-center mb-4">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-48 mx-auto mb-2" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error states
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full">
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                {error === "expired" && (
                  <>
                    <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                      <Clock className="h-8 w-8 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      Download Link Expired
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      This download link has expired. Download links are valid for 24 hours after purchase.
                      Please contact the creator for a new link.
                    </p>
                  </>
                )}

                {error === "max_downloads" && (
                  <>
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      Maximum Downloads Reached
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      This download link has been used the maximum number of times (5 downloads).
                      If you need additional downloads, please contact the creator.
                    </p>
                  </>
                )}

                {error === "invalid" && (
                  <>
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      Invalid Download Link
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      This download link is not valid. It may have been tampered with or does not exist.
                      Please check the link and try again.
                    </p>
                  </>
                )}

                {error === "server_error" && (
                  <>
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      Something Went Wrong
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      We couldn&apos;t process your download. Please try again later or contact support.
                    </p>
                  </>
                )}

                <div className="pt-4 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      fetchSessionInfo();
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Home
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No token or no session
  if (!token || !sessionInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Download className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                No Download Token
              </h2>
              <p className="text-sm text-muted-foreground">
                You need a valid download link to access your purchase. Check your email for the download link.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const downloadProgress = (currentDownloadCount / sessionInfo.maxDownloads) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Your Download
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Secure file delivery by Keevan Store
          </p>
        </div>

        {/* Product Card */}
        <Card>
          <CardContent className="p-6 space-y-5">
            {/* Product Info */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                {sessionInfo.productThumbnail ? (
                  <img
                    src={sessionInfo.productThumbnail}
                    alt={sessionInfo.productName}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <FileText className="h-6 w-6 text-emerald-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {sessionInfo.productName}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  by {sessionInfo.creatorName}
                </p>
                {sessionInfo.fileName && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <HardDrive className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {sessionInfo.fileName}
                      {sessionInfo.fileSize && (
                        <span className="ml-1">({formatFileSize(sessionInfo.fileSize)})</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Expiration & Downloads */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Expires in</span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {timeRemaining}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Downloads</span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {sessionInfo.maxDownloads - currentDownloadCount} of {sessionInfo.maxDownloads} left
                </p>
              </div>
            </div>

            {/* Download Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Download usage</span>
                <span className="text-xs text-muted-foreground">
                  {currentDownloadCount} / {sessionInfo.maxDownloads}
                </span>
              </div>
              <Progress value={downloadProgress} className="h-2" />
            </div>

            {/* Download Button */}
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Preparing Download...
                </>
              ) : downloadComplete ? (
                <>
                  <ShieldCheck className="h-5 w-5 mr-2" />
                  Download Started!
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Download Now
                </>
              )}
            </Button>

            {/* Security Notice */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                This download link is secure and tied to your purchase.
                Do not share this link — it is limited to {sessionInfo.maxDownloads} downloads
                and expires 24 hours after purchase.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status Badges */}
        <div className="flex items-center justify-center gap-2">
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            Secure
          </Badge>
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            24h Access
          </Badge>
          <Badge variant="secondary">
            <Download className="h-3 w-3 mr-1" />
            {sessionInfo.maxDownloads} Downloads
          </Badge>
        </div>

        {/* Support Link */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Having trouble downloading?{" "}
            <Link
              href="/"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Contact support
            </Link>
          </p>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Keevan Store
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading download...</p>
          </div>
        </div>
      }
    >
      <DownloadPageContent />
    </Suspense>
  );
}
