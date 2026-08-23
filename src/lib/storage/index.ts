import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ---------------------------------------------------------------------------
// Client Initialization
// ---------------------------------------------------------------------------

const BUCKET = process.env.FILEBASE_BUCKET ?? "studzy";
const ENDPOINT = process.env.FILEBASE_ENDPOINT ?? "https://s3.filebase.com";

const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: "us-east-1", // Filebase ignores region but SDK requires it
  credentials: {
    accessKeyId: process.env.FILEBASE_ACCESS_KEY!,
    secretAccessKey: process.env.FILEBASE_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for S3-compatible providers
});

// ---------------------------------------------------------------------------
// Public URL helper
// ---------------------------------------------------------------------------

/**
 * Returns the public URL for an object in the Filebase bucket.
 * Filebase serves public objects at: https://<bucket>.s3.filebase.com/<key>
 */
export function getPublicUrl(key: string): string {
  const cleanKey = key.replace(/^\/+/, "");
  return `/api/storage/${cleanKey}`;
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export interface UploadOptions {
  /** The object key (path) in the bucket, e.g. "resources/abc123/file.pdf" */
  key: string;
  /** The file body — Buffer, ReadableStream, or Blob */
  body: Buffer | ReadableStream | Blob | Uint8Array;
  /** MIME type, e.g. "application/pdf" */
  contentType: string;
  /** Optional metadata key-value pairs */
  metadata?: Record<string, string>;
}

/**
 * Upload a file to Filebase.
 * Returns the public URL of the uploaded object.
 */
export async function uploadFile(opts: UploadOptions): Promise<string> {
  const { key, body, contentType, metadata } = opts;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body as any,
      ContentType: contentType,
      Metadata: metadata,
    })
  );

  return getPublicUrl(key);
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Delete a single object from Filebase.
 */
export async function deleteFile(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

// ---------------------------------------------------------------------------
// Get Object (download / stream)
// ---------------------------------------------------------------------------

/**
 * Get the raw object from Filebase. Useful for proxying downloads and streaming.
 */
export async function getFile(key: string, range?: string) {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Range: range,
    })
  );
  return response;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

/**
 * Retrieve metadata (content-type, size, etc.) for an object without
 * downloading the body.
 */
export async function getFileMetadata(key: string) {
  const head = await s3.send(
    new HeadObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
  return {
    contentType: head.ContentType,
    contentLength: head.ContentLength,
    lastModified: head.LastModified,
    metadata: head.Metadata,
    eTag: head.ETag,
  };
}

// ---------------------------------------------------------------------------
// Presigned URL
// ---------------------------------------------------------------------------

/**
 * Generate a temporary presigned URL for private downloads.
 * @param key    Object key
 * @param expiresIn  Seconds until the URL expires (default 3600 = 1 hour)
 */
export async function getPresignedUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  );
  return url;
}

/**
 * Generate a temporary presigned PUT URL for direct client-to-storage uploads.
 * Bypasses serverless request body size limits in production.
 * @param key    Object key
 * @param contentType  MIME type (defaults to application/octet-stream)
 * @param expiresIn  Seconds until the URL expires (default 3600 = 1 hour)
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string = "application/octet-stream",
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return await getSignedUrl(s3, command, { expiresIn });
}

// ---------------------------------------------------------------------------
// List Objects
// ---------------------------------------------------------------------------

/**
 * List objects under a given prefix (folder).
 * Returns keys and sizes.
 */
export async function listFiles(prefix: string, maxKeys = 1000) {
  const response = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys,
    })
  );
  return (response.Contents ?? []).map((obj) => ({
    key: obj.Key!,
    size: obj.Size,
    lastModified: obj.LastModified,
  }));
}

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

/**
 * Copy an object within the same bucket.
 */
export async function copyFile(
  sourceKey: string,
  destinationKey: string
): Promise<string> {
  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${sourceKey}`,
      Key: destinationKey,
    })
  );
  return getPublicUrl(destinationKey);
}

// ---------------------------------------------------------------------------
// Exists
// ---------------------------------------------------------------------------

/**
 * Check if an object exists in the bucket.
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Re-export client for advanced use cases
// ---------------------------------------------------------------------------
export { s3, BUCKET, ENDPOINT };
