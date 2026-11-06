import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";

// S3-compatible storage architecture: a key-based interface with two drivers.
// Local driver (default, dev) writes under ./public/uploads. S3 driver activates
// only when S3_BUCKET + credentials are configured. Never store raw binaries in Postgres.

export interface StorageDriver {
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
}

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateUpload(contentType: string, sizeBytes: number): void {
  if (!ALLOWED_TYPES.has(contentType)) throw new Error(`Unsupported upload type: ${contentType}`);
  if (sizeBytes > MAX_UPLOAD_BYTES) throw new Error("File exceeds 10MB limit");
}

class LocalDriver implements StorageDriver {
  async upload(key: string, buffer: Buffer): Promise<string> {
    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const safe = key.replace(/[^a-zA-Z0-9._/-]/g, "_");
    const full = path.join(dir, safe);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buffer);
    return `/uploads/${safe}`;
  }
  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(path.join(process.cwd(), "public", "uploads", key));
    } catch {
      /* already gone */
    }
  }
}

class S3Driver implements StorageDriver {
  private client: S3Client;
  private bucket: string;
  private base: string;
  constructor() {
    this.bucket = process.env.S3_BUCKET as string;
    this.base = process.env.S3_PUBLIC_BASE_URL || `https://${this.bucket}.s3.${process.env.S3_REGION}.amazonaws.com`;
    this.client = new S3Client({
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
      },
    });
  }
  async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: contentType }));
    return `${this.base}/${key}`;
  }
  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

export function getStorage(): StorageDriver {
  if (process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
    return new S3Driver();
  }
  return new LocalDriver();
}
