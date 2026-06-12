// ============================================================
// POST /api/uploads — Upload file to R2 or local
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { uploadFile, isR2Ready } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "keevan-store";
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Generate unique key
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).slice(2, 8);
    const ext = file.name.split(".").pop();
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
  } catch {
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}
