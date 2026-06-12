// ============================================================
// GET /api/download/[token] — Secure download delivery
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  isUsingMockData,
  getMockDownloadSession,
  getMockProductById,
  getMockCreatorById,
} from "@/lib/mock-data";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/r2";
import { mapProductFromDb } from "@/lib/db-mappers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const action = request.nextUrl.searchParams.get("action");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing download token" },
        { status: 400 }
      );
    }

    if (isUsingMockData()) {
      // ── Mock Mode ──────────────────────────────────────────
      const session = getMockDownloadSession(token);

      if (!session) {
        return NextResponse.json(
          { success: false, error: "Invalid download token" },
          { status: 404 }
        );
      }

      // Check expiration
      if (new Date(session.expiresAt) < new Date()) {
        return NextResponse.json(
          { success: false, error: "Download link has expired" },
          { status: 410 }
        );
      }

      // Check download count
      if (session.downloadCount >= session.maxDownloads) {
        return NextResponse.json(
          { success: false, error: "Maximum downloads reached" },
          { status: 429 }
        );
      }

      const product = getMockProductById(session.productId);
      const creator = product ? getMockCreatorById(product.creatorId) : null;

      if (action === "download") {
        // Increment download count
        session.downloadCount += 1;
        session.lastDownloadedAt = new Date().toISOString();

        // In mock mode, return a mock download URL
        const downloadUrl = product?.fileUrl || `/uploads/products/${session.productId}/${product?.fileName || "file.zip"}`;

        return NextResponse.json({
          success: true,
          downloadUrl,
          downloadCount: session.downloadCount,
          maxDownloads: session.maxDownloads,
        });
      }

      // Return session info
      return NextResponse.json({
        success: true,
        data: {
          id: session.id,
          productId: session.productId,
          productName: product?.title || "Unknown Product",
          productThumbnail: product?.thumbnailUrl || null,
          fileName: product?.fileName || null,
          fileSize: product?.fileSize || null,
          creatorName: creator?.displayName || "Unknown Creator",
          expiresAt: session.expiresAt,
          downloadCount: session.downloadCount,
          maxDownloads: session.maxDownloads,
          remainingDownloads: session.maxDownloads - session.downloadCount,
          createdAt: session.createdAt,
        },
      });
    }

    // ── Real Supabase Mode ─────────────────────────────────
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { success: false, error: "Service unavailable" },
        { status: 500 }
      );
    }

    // Find the download session by token
    const { data: sessionRow, error: sessionError } = await serviceClient
      .from("download_sessions")
      .select("*")
      .eq("download_token", token)
      .single();

    if (sessionError || !sessionRow) {
      return NextResponse.json(
        { success: false, error: "Invalid download token" },
        { status: 404 }
      );
    }

    // Check expiration
    if (new Date(sessionRow.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Download link has expired" },
        { status: 410 }
      );
    }

    // Check download count
    if (sessionRow.download_count >= sessionRow.max_downloads) {
      return NextResponse.json(
        { success: false, error: "Maximum downloads reached" },
        { status: 429 }
      );
    }

    // Get product details
    const { data: productRow, error: productError } = await serviceClient
      .from("products")
      .select("*")
      .eq("id", sessionRow.product_id)
      .single();

    if (productError || !productRow) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const product = mapProductFromDb(productRow);

    // Get creator details
    const { data: creatorRow } = await serviceClient
      .from("creators")
      .select("display_name")
      .eq("id", productRow.creator_id)
      .single();

    if (action === "download") {
      // Generate a signed R2 URL for the file
      let downloadUrl = "";

      if (productRow.file_url) {
        // Extract the bucket and key from file_url
        const fileUrl = productRow.file_url as string;
        const bucket = process.env.R2_BUCKET_NAME || "keevan-store";

        // If file_url is a full R2 path, extract the key
        let key = fileUrl;
        if (fileUrl.includes(".r2.cloudflarestorage.com/")) {
          key = fileUrl.split(".r2.cloudflarestorage.com/")[1] || fileUrl;
        } else if (fileUrl.startsWith("/uploads/")) {
          key = fileUrl.replace("/uploads/", "");
        }

        try {
          downloadUrl = await getSignedUrl(bucket, key);
        } catch {
          // Fallback to the raw URL
          downloadUrl = fileUrl;
        }
      }

      // Increment download count and update last_downloaded_at
      await serviceClient
        .from("download_sessions")
        .update({
          download_count: sessionRow.download_count + 1,
          last_downloaded_at: new Date().toISOString(),
        })
        .eq("id", sessionRow.id);

      return NextResponse.json({
        success: true,
        downloadUrl,
        downloadCount: sessionRow.download_count + 1,
        maxDownloads: sessionRow.max_downloads,
      });
    }

    // Return session info (no action param)
    return NextResponse.json({
      success: true,
      data: {
        id: sessionRow.id,
        productId: sessionRow.product_id,
        productName: product.title,
        productThumbnail: product.thumbnailUrl,
        fileName: product.fileName,
        fileSize: product.fileSize,
        creatorName: creatorRow?.display_name || "Unknown Creator",
        expiresAt: sessionRow.expires_at,
        downloadCount: sessionRow.download_count,
        maxDownloads: sessionRow.max_downloads,
        remainingDownloads: sessionRow.max_downloads - sessionRow.download_count,
        createdAt: sessionRow.created_at,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
