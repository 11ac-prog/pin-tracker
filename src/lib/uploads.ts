import { put } from "@vercel/blob";
import crypto from "crypto";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};

// Uploads a photo to Vercel Blob and returns its public URL.
export async function saveUploadedImage(file: File, subdir: string): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;

  const extension = EXTENSION_BY_MIME_TYPE[file.type];
  if (!extension) return null;

  const pathname = `${subdir}/${crypto.randomUUID()}.${extension}`;
  // Read the file fully into memory before handing it to Blob: passing the
  // File itself as the body reuses its underlying stream, which Next's own
  // multipart parsing has already touched, and blows up with "ReadableStream
  // is locked" once deployed.
  const buffer = Buffer.from(await file.arrayBuffer());
  const blob = await put(pathname, buffer, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
  });

  return blob.url;
}

// Downloads an image from an external URL and re-hosts it on Vercel Blob,
// so the app doesn't depend on a third-party site's CDN staying up.
export async function saveImageFromUrl(sourceUrl: string, subdir: string): Promise<string | null> {
  const res = await fetch(sourceUrl);
  if (!res.ok) return null;

  const contentType = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
  const extension = EXTENSION_BY_MIME_TYPE[contentType] ?? "jpg";

  const buffer = Buffer.from(await res.arrayBuffer());
  const pathname = `${subdir}/${crypto.randomUUID()}.${extension}`;
  const blob = await put(pathname, buffer, {
    access: "public",
    addRandomSuffix: false,
    contentType: contentType || "image/jpeg",
  });

  return blob.url;
}

// Resolves the image to save for a form: an uploaded file (if any) wins over
// a pasted URL, which wins over whatever was already there (carried through
// the form as a hidden "currentImageUrl" field so editing without touching
// the photo doesn't clear it).
export async function resolveImageUrl(formData: FormData, subdir: string): Promise<string | null> {
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    const saved = await saveUploadedImage(file, subdir);
    if (saved) return saved;
  }

  const url = String(formData.get("imageUrl") ?? "").trim();
  if (url) return url;

  const current = String(formData.get("currentImageUrl") ?? "").trim();
  return current || null;
}
