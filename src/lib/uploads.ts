import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};

// Saves an uploaded photo under public/uploads so it's servable as a plain
// static file, and returns the URL to store on the record (e.g. Pin.imageUrl).
export async function saveUploadedImage(file: File, subdir: string): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;

  const extension = EXTENSION_BY_MIME_TYPE[file.type];
  if (!extension) return null;

  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });

  const filename = `${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/${subdir}/${filename}`;
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
