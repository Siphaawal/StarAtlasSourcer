import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export const ALLOWED_IMAGE_TYPES = Object.keys(EXT_BY_TYPE);
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // hard ceiling; per-request limit enforced separately

/**
 * Persist an uploaded image to /public/uploads/<subdir> and return its public URL path.
 * Validates MIME type and size. Throws Error with a user-friendly message on failure.
 */
export async function saveImage(
  file: File,
  subdir: "backgrounds" | "submissions",
  opts?: { maxBytes?: number }
): Promise<string> {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("No file provided.");
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Unsupported image type "${file.type || "unknown"}". Allowed: PNG, JPG, WEBP, GIF, SVG.`);
  }
  const maxBytes = Math.min(opts?.maxBytes ?? MAX_UPLOAD_BYTES, MAX_UPLOAD_BYTES);
  if (file.size > maxBytes) {
    throw new Error(`File too large (${(file.size / 1048576).toFixed(1)} MB). Max ${(maxBytes / 1048576).toFixed(0)} MB.`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  return saveImageBuffer(bytes, file.type, subdir);
}

/** Persist a raw image buffer (validates MIME + size). */
export async function saveImageBuffer(
  bytes: Buffer,
  mime: string,
  subdir: "backgrounds" | "submissions",
  opts?: { maxBytes?: number }
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(mime)) {
    throw new Error(`Unsupported image type "${mime || "unknown"}". Allowed: PNG, JPG, WEBP, GIF, SVG.`);
  }
  const maxBytes = Math.min(opts?.maxBytes ?? MAX_UPLOAD_BYTES, MAX_UPLOAD_BYTES);
  if (bytes.length > maxBytes) {
    throw new Error(`File too large (${(bytes.length / 1048576).toFixed(1)} MB). Max ${(maxBytes / 1048576).toFixed(0)} MB.`);
  }
  const ext = EXT_BY_TYPE[mime] ?? "png";
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${subdir}/${filename}`;
}

/** Fetch a remote image URL and persist it (used by the API for background uploads). */
export async function saveRemoteImage(
  url: string,
  subdir: "backgrounds" | "submissions",
  opts?: { maxBytes?: number }
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("Could not fetch the image URL.");
  }
  if (!res.ok) throw new Error(`Image URL returned ${res.status}.`);
  const mime = (res.headers.get("content-type") || "").split(";")[0].trim();
  const bytes = Buffer.from(await res.arrayBuffer());
  return saveImageBuffer(bytes, mime, subdir, opts);
}
