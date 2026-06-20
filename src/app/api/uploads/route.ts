// ============================================================
// POST /api/uploads — Upload file to R2
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { uploadFile, getR2ConfigStatus } from "@/lib/r2";
import { verifyAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

// Allowed MIME types for upload
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  images: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  documents: [
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "application/vnd.rar",
  ],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"],
  video: ["video/mp4", "video/webm"],
};

const ALL_ALLOWED_MIMES = Object.values(ALLOWED_MIME_TYPES).flat();

// Vercel serverless functions have a 4.5MB body limit on free plan
// We set limits slightly below to account for overhead
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (Vercel free tier limit)
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB for images

// Allowed folder names (prevents path traversal)
const ALLOWED_FOLDERS = ["thumbnails", "products", "profiles", "banners", "uploads"];

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
  "jpg", "jpeg", "png", "gif", "webp", "svg",
  "pdf", "zip", "rar",
  "mp3", "wav", "ogg", "m4a",
  "mp4", "webm",
];

function sanitizePathSegment(input: string): string {
  // Remove any path traversal characters and non-alphanumeric chars (except hyphens)
  return input.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    console.log("Upload request received");

    // Check R2 configuration first
    const r2Status = getR2ConfigStatus();
    if (!r2Status.configured) {
      console.error("R2 not configured:", r2Status);
      return NextResponse.json(
        {
          success: false,
          error: "Storage not configured",
          details: `Missing R2 environment variables: ${r2Status.missing.join(", ")}`,
        },
        { status: 503 }
      );
    }

    // Rate limit: 10 uploads per minute per IP
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(`uploads:${clientId}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      console.log("Rate limit exceeded for client:", clientId);
      return NextResponse.json(
        { success: false, error: "Too many upload attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Authentication check — user must be logged in
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      console.log("Upload failed: User not authenticated");
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in to upload files" },
        { status: 401 }
      );
    }

    console.log("User authenticated successfully:", authResult.userId);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = sanitizePathSegment((formData.get("bucket") as string) || "keevanstore");
    const rawFolder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      console.log("Upload failed: No file provided");
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("File received:", { name: file.name, size: file.size, type: file.type });

    // Validate folder name against allowlist
    const folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : "uploads";

    // Validate file size
    const isImage = file.type.startsWith("image/");
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size is ${isImage ? "2MB" : "4MB"} for images and files respectively` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALL_ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `File type "${file.type}" is not allowed. Allowed types: images, PDFs, ZIPs, audio, video` },
        { status: 400 }
      );
    }

    // Validate file extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { success: false, error: `File extension ".${ext || 'unknown'}" is not allowed` },
        { status: 400 }
      );
    }

    // Generate unique key with sanitized extension
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).slice(2, 8);
    const key = `${folder}/${timestamp}-${randomStr}.${ext}`;

    console.log("Starting upload to:", { bucket, key, contentType: file.type });

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("Buffer created, size:", buffer.length);

    const url = await uploadFile(bucket, key, buffer, file.type);
    console.log("Upload successful, URL:", url);

    return NextResponse.json({
      success: true,
      data: {
        url,
        key,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
      },
    });
  } catch (error) {
    console.error("Error in uploads POST:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));

    // Provide specific error messages based on error type
    let errorMessage = "Upload failed. Please check your connection and try again.";
    let statusCode = 500;

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("not configured") || message.includes("r2")) {
        errorMessage = "Storage not configured. Please contact support.";
        statusCode = 503;
      } else if (message.includes("credentials") || message.includes("access key")) {
        errorMessage = "Storage authentication failed. Please contact support.";
        statusCode = 503;
      } else if (message.includes("network") || message.includes("fetch") || message.includes("etimedout")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (message.includes("econnrefused")) {
        errorMessage = "Connection refused. Please check your network settings.";
      } else if (message.includes("bucket") || message.includes("not found")) {
        errorMessage = "Storage bucket not found. Please contact support.";
        statusCode = 503;
      } else if (message.includes("permission") || message.includes("access denied")) {
        errorMessage = "Access denied. Please check storage permissions.";
        statusCode = 403;
      } else if (message.includes("quota") || message.includes("limit")) {
        errorMessage = "Storage quota exceeded. Please contact support.";
        statusCode = 507;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: statusCode }
    );
  }
}
