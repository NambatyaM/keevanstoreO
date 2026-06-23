// ============================================================
// Cloudflare R2 Upload Module (S3-compatible)
// Requires R2 credentials to be configured (no fallback mode)
// ============================================================
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getPresignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { DOWNLOAD_URL_EXPIRY } from "./constants";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "keevanstore";

const isR2Configured =
  R2_ACCOUNT_ID && R2_ACCOUNT_ID !== "mock" &&
  R2_ACCESS_KEY_ID && R2_ACCESS_KEY_ID !== "mock" &&
  R2_SECRET_ACCESS_KEY && R2_SECRET_ACCESS_KEY !== "mock" &&
  R2_BUCKET_NAME && R2_BUCKET_NAME !== "mock";

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!isR2Configured) {
    throw new Error(
      "R2 storage is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME environment variables."
    );
  }
  if (r2Client) return r2Client;

  console.log("Initializing R2 client with account:", R2_ACCOUNT_ID);
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

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    console.log(`File uploaded to R2: ${bucket}/${key}`);
    // FIXED: Return public URL format for R2 public buckets
    // Use the pub- subdomain format for public R2 bucket access
    return `https://pub-${R2_ACCOUNT_ID}.r2.dev/${bucket}/${key}`;
  } catch (error) {
    console.error("R2 upload error:", error);
    if (error instanceof Error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
    throw new Error("File upload failed: Could not upload to R2 storage");
  }
}

export async function deleteFile(
  bucket: string,
  key: string
): Promise<void> {
  const client = getR2Client();

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

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getPresignedUrl(client, command, { expiresIn });
}

export function isR2Ready(): boolean {
  return !!isR2Configured;
}

export function getR2ConfigStatus(): {
  configured: boolean;
  missing: string[];
  details: Record<string, boolean>;
} {
  const missing: string[] = [];
  const details: Record<string, boolean> = {
    hasAccountId: !!R2_ACCOUNT_ID && R2_ACCOUNT_ID !== "mock",
    hasAccessKeyId: !!R2_ACCESS_KEY_ID && R2_ACCESS_KEY_ID !== "mock",
    hasSecretKey: !!R2_SECRET_ACCESS_KEY && R2_SECRET_ACCESS_KEY !== "mock",
    hasBucketName: !!R2_BUCKET_NAME && R2_BUCKET_NAME !== "mock",
  };

  if (!details.hasAccountId) missing.push("R2_ACCOUNT_ID");
  if (!details.hasAccessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!details.hasSecretKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!details.hasBucketName) missing.push("R2_BUCKET_NAME");

  return {
    configured: missing.length === 0,
    missing,
    details,
  };
}
