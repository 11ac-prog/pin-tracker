import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "crypto";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};

function r2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

// Uploads a photo to Cloudflare R2 (S3-compatible) and returns its public URL.
export async function saveUploadedImage(file: File, subdir: string): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;

  const extension = EXTENSION_BY_MIME_TYPE[file.type];
  if (!extension) return null;

  const key = `${subdir}/${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await r2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }),
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
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
