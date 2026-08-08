import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/**
 * Simpan file bukti transfer ke /public/uploads dan kembalikan URL publik
 * (mis. "/uploads/xxxx.png"). Mengembalikan null bila tidak ada file.
 */
export async function saveBuktiFile(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  if (!ALLOWED.has(file.type)) {
    throw new Error("Format file harus JPG, PNG, WEBP, atau PDF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Ukuran file maksimal 5 MB.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(file.name) || guessExt(file.type);
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/${filename}`;
}

function guessExt(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "application/pdf":
      return ".pdf";
    default:
      return "";
  }
}
