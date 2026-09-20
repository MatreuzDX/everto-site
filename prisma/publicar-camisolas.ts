/**
 * Sobe as 35 fotos para o Vercel Blob e cria as 22 camisolas no banco
 * (Supabase), a partir de catalogo-camisolas.ts.
 *
 *   npx tsx prisma/publicar-camisolas.ts
 *
 * Precisa de, no .env:
 *   BLOB_READ_WRITE_TOKEN   (Vercel → Storage → Blob → .env.local tab)
 *   DATABASE_URL            (Supabase, já usado pelo resto do projeto)
 *
 * Idempotente: se a camisola já existir (pelo slug), salta-a.
 * Cria tudo em status DRAFT — nada fica visível na loja até se rever os
 * preços/tamanhos por confirmar e mudar para ACTIVE no admin.
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { CATALOGO, PRECO_PADRAO_CENTS, STOCK_SEMPRE_DISPONIVEL } from "./catalogo-camisolas";

const FOTOS_DIR = path.join(__dirname, "..", "whatsapp-fotos");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

function slugify(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Falta BLOB_READ_WRITE_TOKEN no .env — Vercel → Storage → Blob → .env.local");
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL no .env");

  const categorias = await prisma.category.findMany();
  const uploadCache = new Map<string, string>();

  let criadas = 0;
  let puladas = 0;

  for (const item of CATALOGO) {
    const slug = slugify(item.name);
    const existente = await prisma.product.findUnique({ where: { slug } });
    if (existente) {
      puladas++;
      console.log(`⏭  já existe: ${item.name}`);
      continue;
    }

    const category = categorias.find((c) => c.slug === item.category);

    const urls: string[] = [];
    for (const foto of item.photos) {
      if (uploadCache.has(foto)) {
        urls.push(uploadCache.get(foto)!);
        continue;
      }
      const buffer = readFileSync(path.join(FOTOS_DIR, foto));
      const blob = await put(`camisolas/${foto}`, buffer, { access: "public", contentType: "image/jpeg" });
      uploadCache.set(foto, blob.url);
      urls.push(blob.url);
      console.log(`  ↑ subida: ${foto}`);
    }

    const priceCents = item.priceCents ?? PRECO_PADRAO_CENTS; // placeholder só quando falta — fica DRAFT
    const sizes = item.sizes ?? ["A confirmar"];

    await prisma.product.create({
      data: {
        name: item.name,
        slug,
        status: "DRAFT",
        categoryId: category?.id ?? null,
        priceCents,
        salePriceCents: null,
        effectivePriceCents: priceCents,
        description: item.note ?? null,
        lowStockThreshold: 0,
        importNotes: item.note ?? null,
        images: { create: urls.map((url, i) => ({ url, sortOrder: i, alt: item.name })) },
        variants: {
          create: sizes.map((size, i) => ({ size, stock: STOCK_SEMPRE_DISPONIVEL, sortOrder: i })),
        },
      },
    });
    criadas++;
    console.log(`✅ criada (rascunho): ${item.name}`);
  }

  console.log(`\nConcluído: ${criadas} criadas, ${puladas} já existiam.`);
  console.log(`Estão todas em RASCUNHO. Rever preço/tamanhos por confirmar e publicar pelo admin.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
