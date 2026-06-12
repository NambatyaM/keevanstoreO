// ============================================================
// Cloudflare R2 Upload Module (S3-compatible)
// ============================================================
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { DOWNLOAD_URL_EXPIRY } from "./constants";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "keevan-store";

const isR2Configured =
  R2_ACCOUNT_ID && R2_ACCOUNT_ID !== "mock" &&
  R2_ACCESS_KEY_ID && R2_ACCESS_KEY_ID !== "mock" &&
  R2_SECRET_ACCESS_KEY && R2_SECRET_ACCESS_KEY !== "mock";

let r2Client: S3Client | null = null;

function getR2Client(): S3Client | null {
  if (!isR2Configured) return null;
  if (r2Client) return r2Client;

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });

  return r2Client;
}

export async function uploadFile(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const client = getR2Client();

  if (!client) {
    // Mock: save to local filesystem
    const uploadDir = path.join(process.cwd(), "uploads", bucket);
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, key);
    await writeFile(filePath, body);
    return `/uploads/${bucket}/${key}`;
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return `https://${bucket}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}

export async function deleteFile(
  bucket: string,
  key: string
): Promise<void> {
  const client = getR2Client();

  if (!client) {
    // Mock: delete from local filesystem
    const filePath = path.join(process.cwd(), "uploads", bucket, key);
    try {
      await unlink(filePath);
    } catch {
      // File might not exist
    }
    return;
  }

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

export async function getSignedUrl(
  bucket: string,
  key: string,
  expiresIn: number = DOWNLOAD_URL_EXPIRY
): Promise<string> {
  const client = getR2Client();

  if (!client) {
    // Mock: return local path
    return `/uploads/${bucket}/${key}`;
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export function isR2Ready(): boolean {
  return !!isR2Configured;
}
