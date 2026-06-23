// ============================================================
// POST /api/uploads — Upload file to R2
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { uploadFile, getR2ConfigStatus } from "@/lib/r2";
import { verifyAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import { handleApiError, getStatusCode } from "@/lib/error-handler";

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

// Magic numbers (file signatures) for validation
const MAGIC_NUMBERS: Record<string, number[]> = {
  "image/jpeg": [0xFF, 0xD8, 0xFF],
  "image/png": [0x89, 0x50, 0x4E, 0x47],
  "image/gif": [0x47, 0x49, 0x46],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
  "image/svg+xml": [], // SVG is text-based, no magic number
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
  "application/zip": [0x50, 0x4B, 0x03, 0x04],
  "application/x-zip-compressed": [0x50, 0x4B, 0x03, 0x04],
  "application/vnd.rar": [0x52, 0x61, 0x72, 0x21],
  "audio/mpeg": [0xFF, 0xFB],
  "audio/wav": [0x52, 0x49, 0x46, 0x46],
  "audio/ogg": [0x4F, 0x67, 0x67, 0x53],
  "audio/mp4": [0x00, 0x00, 0x00], // MP4 audio container
  "video/mp4": [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
  "video/webm": [0x1A, 0x45, 0xDF, 0xA3],
};

function sanitizePathSegment(input: string): string {
  // Remove any path traversal characters and non-alphanumeric chars (except hyphens)
  return input.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
}

function validateMagicNumber(buffer: Buffer, mimeType: string): boolean {
  const magicNumbers = MAGIC_NUMBERS[mimeType];
  if (!magicNumbers || magicNumbers.length === 0) {
    return true; // Skip validation for types without magic numbers (e.g., SVG)
  }

  // Check if buffer starts with the expected magic number
  for (let i = 0; i < magicNumbers.length; i++) {
    if (buffer[i] !== magicNumbers[i]) {
      return false;
    }
  }
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Check R2 configuration first
    const r2Status = getR2ConfigStatus();
    if (!r2Status.configured) {
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
    const bucket = sanitizePathSegment((formData.get("bucket") as string) || "keevanstore");
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

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate file content using magic numbers
    if (!validateMagicNumber(buffer, file.type)) {
      return NextResponse.json(
        { success: false, error: `File content does not match declared type "${file.type}". File may be corrupted or renamed.` },
        { status: 400 }
      );
    }

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
    const errorResponse = handleApiError(error);
    const statusCode = getStatusCode(error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
