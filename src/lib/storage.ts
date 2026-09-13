/**
 * Armazenamento de imagens.
 *   - Produção: Vercel Blob (BLOB_READ_WRITE_TOKEN).
 *   - Desenvolvimento sem token: public/uploads.
 * O banco só guarda o URL. Para mudar para Cloudflare R2 no futuro, basta
 * reescrever estas duas funções.
 */

import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import { slugify } from "./format";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);
const MAX_BYTES = 8 * 1024 * 1024;

export class StorageError extends Error {}

export async function uploadImage(file: File, folder = "produtos"): Promise<string> {
  const ext = ALLOWED.get(file.type);
  if (!ext) throw new StorageError("Formato não suportado. Use JPG, PNG, WebP ou AVIF.");
  if (file.size > MAX_BYTES) throw new StorageError("Imagem acima de 8 MB.");

  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "imagem";
  const name = `${base}-${randomBytes(4).toString("hex")}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`${folder}/${name}`, file, { access: "public", contentType: file.type });
    return blob.url;
  }

  if (process.env.NODE_ENV === "production") {
    throw new StorageError(
      "Armazenamento de imagens não configurado. Vercel → Storage → Blob → ligar ao projeto.",
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${folder}/${name}`;
}

export async function deleteImage(url: string) {
  try {
    if (url.includes(".blob.vercel-storage.com")) {
      if (process.env.BLOB_READ_WRITE_TOKEN) await del(url);
    } else if (url.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "public", url));
    }
  } catch (error) {
    console.error("[storage] não foi possível apagar", url, error);
  }
}
