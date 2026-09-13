"use server";

import { Prisma, type ProductStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { optionalStr, parsePriceToCents, slugify, str } from "@/lib/format";
import { revalidateStore } from "@/lib/revalidate";
import { deleteImage, StorageError, uploadImage } from "@/lib/storage";

export type ProductFormState = { ok: boolean; message: string } | null;

const variantSchema = z.array(
  z.object({
    id: z.string().max(40).optional(),
    size: z.string().trim().max(20).nullable(),
    color: z.string().trim().max(40).nullable(),
    sku: z.string().trim().max(60).nullable(),
    stock: z.number().int().min(0).max(100000),
  }),
).max(80);

const imageSchema = z.array(z.object({ url: z.string().min(1).max(500), alt: z.string().max(200).nullable() })).max(20);

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "produto";
  let slug = root;
  for (let i = 2; ; i++) {
    const clash = await prisma.product.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
    if (!clash) return slug;
    slug = `${root}-${i}`;
  }
}

/** Apaga ficheiros que já nenhum produto usa (duplicados partilham imagens). */
async function deleteOrphanImages(urls: string[]) {
  for (const url of urls) {
    const stillUsed = await prisma.productImage.count({ where: { url } });
    if (stillUsed === 0) await deleteImage(url);
  }
}

export async function uploadProductImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  await requireStaff();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Ficheiro em falta." };
  try {
    return { url: await uploadImage(file, "produtos") };
  } catch (error) {
    if (error instanceof StorageError) return { error: error.message };
    console.error("[upload]", error);
    return { error: "Falha no upload." };
  }
}

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const user = await requireStaff();
  const id = optionalStr(formData.get("id"));

  const name = str(formData.get("name"));
  if (name.length < 2) return { ok: false, message: "O nome é obrigatório." };

  const priceCents = parsePriceToCents(formData.get("price"));
  if (priceCents == null || priceCents <= 0) return { ok: false, message: "Indica um preço válido (ex.: 79,90)." };
  const salePriceCents = parsePriceToCents(formData.get("salePrice"));
  if (salePriceCents != null && salePriceCents >= priceCents) {
    return { ok: false, message: "O preço promocional tem de ser inferior ao preço normal." };
  }

  let variants: z.infer<typeof variantSchema>;
  let images: z.infer<typeof imageSchema>;
  try {
    variants = variantSchema.parse(JSON.parse(str(formData.get("variants")) || "[]"));
    images = imageSchema.parse(JSON.parse(str(formData.get("images")) || "[]"));
  } catch {
    return { ok: false, message: "Variantes ou imagens inválidas." };
  }
  if (variants.length === 0) return { ok: false, message: "Adiciona pelo menos uma variante (tamanho/cor com stock)." };
  const combos = new Set(variants.map((v) => `${v.size ?? ""}|${v.color ?? ""}`.toLowerCase()));
  if (combos.size !== variants.length) return { ok: false, message: "Há variantes repetidas (mesmo tamanho e cor)." };

  const status = (["DRAFT", "ACTIVE", "ARCHIVED"].includes(str(formData.get("status"))) ? str(formData.get("status")) : "DRAFT") as ProductStatus;
  if (status === "ACTIVE" && images.length === 0) {
    return { ok: false, message: "Para publicar, adiciona pelo menos uma imagem." };
  }

  const slug = await uniqueSlug(str(formData.get("slug")) || name, id ?? undefined);
  const flag = (k: string) => formData.get(k) === "on";
  const authenticityNote = optionalStr(formData.get("authenticityNote"));

  const data = {
    name,
    slug,
    description: optionalStr(formData.get("description")),
    status,
    brandId: optionalStr(formData.get("brandId")),
    categoryId: optionalStr(formData.get("categoryId")),
    priceCents,
    salePriceCents,
    effectivePriceCents: salePriceCents ?? priceCents,
    sku: optionalStr(formData.get("sku")),
    videoUrl: optionalStr(formData.get("videoUrl")),
    isNew: flag("isNew"),
    isFeatured: flag("isFeatured"),
    isBestSeller: flag("isBestSeller"),
    isLimited: flag("isLimited"),
    lowStockThreshold: Math.max(0, Math.min(100, Number(formData.get("lowStockThreshold")) || 2)),
    origin: optionalStr(formData.get("origin")),
    model: optionalStr(formData.get("model")),
    collection: optionalStr(formData.get("collection")),
    edition: optionalStr(formData.get("edition")),
    importNotes: optionalStr(formData.get("importNotes")),
    authenticityNote,
    // Só fica confirmado se houver texto E a caixa estiver marcada.
    authenticityConfirmed: Boolean(authenticityNote) && flag("authenticityConfirmed"),
    seoTitle: optionalStr(formData.get("seoTitle")),
    seoDescription: optionalStr(formData.get("seoDescription")),
  };

  let productId: string;
  let removedImages: string[] = [];

  try {
    productId = await prisma.$transaction(async (tx) => {
      const product = id
        ? await tx.product.update({ where: { id }, data })
        : await tx.product.create({ data });

      // Imagens: substitui a lista pela ordem recebida.
      const previous = await tx.productImage.findMany({ where: { productId: product.id }, select: { url: true } });
      removedImages = previous.map((p) => p.url).filter((u) => !images.some((i) => i.url === u));
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img, i) => ({ productId: product.id, url: img.url, alt: img.alt, sortOrder: i })),
        });
      }

      // Variantes: atualiza, cria e remove. Mudanças de stock ficam no histórico.
      const existing = await tx.productVariant.findMany({
        where: { productId: product.id },
        include: { _count: { select: { orderItems: true } } },
      });
      const keep = new Set(variants.map((v) => v.id).filter(Boolean));

      for (const old of existing) {
        if (keep.has(old.id)) continue;
        if (old._count.orderItems > 0) {
          await tx.productVariant.update({ where: { id: old.id }, data: { isActive: false, sku: null } });
        } else {
          await tx.productVariant.delete({ where: { id: old.id } });
        }
      }

      for (const [index, v] of variants.entries()) {
        const current = v.id ? existing.find((e) => e.id === v.id) : undefined;
        const fields = { size: v.size || null, color: v.color || null, sku: v.sku || null, stock: v.stock, sortOrder: index, isActive: true };
        if (current) {
          await tx.productVariant.update({ where: { id: current.id }, data: fields });
          if (current.stock !== v.stock) {
            await tx.inventoryMovement.create({
              data: { variantId: current.id, change: v.stock - current.stock, reason: "ADJUSTMENT", userId: user.id, note: "Editado no produto" },
            });
          }
        } else {
          const created = await tx.productVariant.create({ data: { ...fields, productId: product.id } });
          if (v.stock > 0) {
            await tx.inventoryMovement.create({
              data: { variantId: created.id, change: v.stock, reason: "RESTOCK", userId: user.id, note: "Stock inicial" },
            });
          }
        }
      }

      return product.id;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "Há um SKU repetido (noutro produto ou variante)." };
    }
    console.error("[saveProduct]", error);
    return { ok: false, message: "Não foi possível guardar o produto." };
  }

  await deleteOrphanImages(removedImages);
  revalidateStore();

  if (!id) redirect(`/admin/produtos/${productId}?guardado=1`);
  return { ok: true, message: status === "ACTIVE" ? "Produto guardado e publicado." : "Produto guardado." };
}

export async function deleteProduct(formData: FormData) {
  await requireStaff();
  const id = str(formData.get("id"));
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true, _count: { select: { orderItems: true } } },
  });
  if (!product) redirect("/admin/produtos");

  if (product._count.orderItems > 0) {
    // Tem vendas: não se apaga (histórico de encomendas), arquiva-se.
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    revalidateStore();
    redirect("/admin/produtos?arquivado=1");
  }

  await prisma.product.delete({ where: { id } });
  await deleteOrphanImages(product.images.map((i) => i.url));
  revalidateStore();
  redirect("/admin/produtos?apagado=1");
}

export async function duplicateProduct(formData: FormData) {
  await requireStaff();
  const id = str(formData.get("id"));
  const source = await prisma.product.findUnique({ where: { id }, include: { images: true, variants: { where: { isActive: true } } } });
  if (!source) redirect("/admin/produtos");

  const {
    id: _id, slug: _slug, createdAt: _c, updatedAt: _u, soldCount: _s, name, status: _st, sku: _sku,
    ...rest
  } = source;
  void [_id, _slug, _c, _u, _s, _st, _sku];

  const copy = await prisma.product.create({
    data: {
      ...rest,
      images: undefined,
      variants: undefined,
      name: `${name} (cópia)`,
      slug: await uniqueSlug(`${name}-copia`),
      status: "DRAFT",
    } as Prisma.ProductUncheckedCreateInput,
  });
  await prisma.productImage.createMany({
    data: source.images.map((img) => ({ productId: copy.id, url: img.url, alt: img.alt, sortOrder: img.sortOrder })),
  });
  // Stock a zero e sem SKU: a cópia é um ponto de partida, não stock real.
  await prisma.productVariant.createMany({
    data: source.variants.map((v) => ({ productId: copy.id, size: v.size, color: v.color, stock: 0, sortOrder: v.sortOrder })),
  });
  redirect(`/admin/produtos/${copy.id}?duplicado=1`);
}
