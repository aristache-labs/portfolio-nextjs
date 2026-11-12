// Server-only Blob utilities. NOT a "use server" actions module (it exports
// constants + types alongside the upload fn). It is reached only through
// server code (admin upload routes), so it never reaches the client.
import { put } from "@vercel/blob";
import sharp from "sharp";

// Vercel Blob is a flat key/value store; a "folder" is just a key prefix
// containing "/". Define every folder once here so uploads stay organized as
// the site grows (avatar, hero, skills, and project media).
export const BLOB_FOLDERS = {
  hero: "hero",
  avatar: "avatar",
  skills: "skills",
  projects: "projects",
} as const;

export type BlobFolder = (typeof BLOB_FOLDERS)[keyof typeof BLOB_FOLDERS];

export const MAX_BYTES = 5 * 1024 * 1024; // 5MB raw upload cap
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
// SVG is not accepted: it can carry scripts and is not worth sanitising for a few icons.

type ResizeOptions = {
  width: number;
  height: number;
  /** "cover" center-crops to the box; "inside" preserves aspect within it. */
  fit?: "cover" | "inside";
  quality?: number;
};

/**
 * Resize, re-encode to WebP, store under a random key in `folder`, return the CDN URL. Blob is
 * flat, so the folder is only a key prefix that keeps each kind of upload separable.
 */
export async function optimizeAndUploadImage(
  file: File,
  folder: BlobFolder,
  resize: ResizeOptions,
): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error(`Unsupported image type: ${file.type}`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image too large (max 5MB)");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const optimized = await sharp(input)
    .resize(resize.width, resize.height, {
      fit: resize.fit ?? "cover",
      position: "center",
    })
    .webp({ quality: resize.quality ?? 80 })
    .toBuffer();

  const key = `${folder}/${crypto.randomUUID()}.webp`;
  const blob = await put(key, optimized, {
    access: "public",
    contentType: "image/webp",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return blob.url;
}

/**
 * Upload an icon-style image (skill icons, etc.): resized and re-encoded to WebP via
 * optimizeAndUploadImage. Returns the public CDN URL.
 */
export async function uploadIcon(file: File, folder: BlobFolder): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("Image too large (max 5MB)");
  }
  // Fit inside a 128px box (preserve aspect), WebP.
  return optimizeAndUploadImage(file, folder, { width: 128, height: 128, fit: "inside" });
}

/**
 * Profile portrait. Deliberately NOT uploadIcon: its 128px box is right for a skill icon and is
 * what made the rendered avatar blurry - About displays it at up to 384 CSS px, so ~768 real
 * pixels on a 2x screen. `inside` keeps the uploaded aspect; the card crops via CSS object-cover.
 */
export async function uploadAvatar(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("Image too large (max 5MB)");
  }
  return optimizeAndUploadImage(file, BLOB_FOLDERS.avatar, {
    width: 1024,
    height: 1024,
    fit: "inside",
    quality: 90,
  });
}

/**
 * Project cover images and quick-view screenshots. Deliberately NOT uploadIcon: that fits
 * inside a 128px box, which is right for a skill icon and destroys a screenshot. `inside`
 * rather than `cover` so a tall mobile screenshot is not centre-cropped into nonsense.
 */
export async function uploadProjectMedia(file: File): Promise<string> {
  return optimizeAndUploadImage(file, BLOB_FOLDERS.projects, {
    width: 1600,
    height: 1000,
    fit: "inside",
  });
}
