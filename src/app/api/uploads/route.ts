// ============================================================
// POST /api/uploads — Upload file to R2 or local
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/r2";
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

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB for images

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
    // Rate limit: 10 uploads per minute per IP
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(`uploads:${clientId}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many upload attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Authentication check — user must be logged in
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in to upload files" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = sanitizePathSegment((formData.get("bucket") as string) || "keevan-store");
    const rawFolder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate folder name against allowlist
    const folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : "uploads";

    // Validate file size
    const isImage = file.type.startsWith("image/");
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size is ${isImage ? "10MB" : "100MB"}` },
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(bucket, key, buffer, file.type);

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
    console.error("Error details:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed. Please check your connection and try again." },
      { status: 500 }
    );
  }
}
