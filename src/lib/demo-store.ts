/**
 * Modo de demonstração SEM banco.
 *
 * Quando o site corre sem DATABASE_URL (ex.: Vercel antes de ligar o
 * Supabase), a loja mostra o catálogo de demonstração em memória em vez de
 * uma loja vazia. É só leitura: encomendas, contas e admin precisam do banco.
 * Assim que DATABASE_URL existir, tudo passa a vir do banco automaticamente.
 */

import type { Category, Product, ProductImage, ProductVariant } from "@prisma/client";
import { BASE_CATEGORIES, type CategoryNode } from "./base-categories";
import { DEMO_CATEGORY_IMAGES, DEMO_PRODUCTS, demoSlug } from "./demo-data";

export function demoMode() {
  return !process.env.DATABASE_URL;
}

const EPOCH = Date.UTC(2026, 8, 1, 12);

export type DemoProduct = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
  brand: null;
  category: Category | null;
  reviews: never[];
};

let categories: Category[] | null = null;
let products: DemoProduct[] | null = null;

export function demoCategories(): Category[] {
  if (categories) return categories;
  const out: Category[] = [];
  const walk = (nodes: CategoryNode[], parentId: string | null) =>
    nodes.forEach((node, index) => {
      const id = `cat-${node.slug}`;
      out.push({
        id,
        name: node.name,
        slug: node.slug,
        description: null,
        imageUrl: DEMO_CATEGORY_IMAGES[node.slug] ?? null,
        parentId,
        sortOrder: index,
        isActive: true,
        showOnHome: node.home ?? false,
        seoTitle: null,
        seoDescription: null,
        createdAt: new Date(EPOCH),
        updatedAt: new Date(EPOCH),
      });
      if (node.children) walk(node.children, id);
    });
  walk(BASE_CATEGORIES, null);
  categories = out;
  return out;
}

export function demoProducts(): DemoProduct[] {
  if (products) return products;
  const cats = demoCategories();
  products = DEMO_PRODUCTS.map((d, i) => {
    const id = `demo-${i + 1}`;
    const priceCents = Math.round(d.price * 100);
    const salePriceCents = d.sale ? Math.round(d.sale * 100) : null;
    const date = new Date(EPOCH - i * 3_600_000);
    const category = cats.find((c) => c.slug === d.category) ?? null;
    return {
      id,
      name: d.name,
      slug: demoSlug(d.name),
      description: `${d.text}\n\nProduto de demonstração — imagem ilustrativa.`,
      status: "ACTIVE",
      brandId: null,
      categoryId: category?.id ?? null,
      priceCents,
      salePriceCents,
      effectivePriceCents: salePriceCents ?? priceCents,
      sku: `DEMO-${String(i + 1).padStart(3, "0")}`,
      videoUrl: null,
      isNew: d.flags?.isNew ?? false,
      isFeatured: d.flags?.isFeatured ?? false,
      isBestSeller: d.flags?.isBestSeller ?? false,
      isLimited: d.flags?.isLimited ?? false,
      lowStockThreshold: 2,
      soldCount: 0,
      origin: null,
      model: null,
      collection: null,
      edition: null,
      importNotes: null,
      authenticityNote: null,
      authenticityConfirmed: false,
      seoTitle: null,
      seoDescription: null,
      createdAt: date,
      updatedAt: date,
      images: d.images.map((url, j) => ({ id: `${id}-img-${j}`, productId: id, url, alt: d.name, sortOrder: j })),
      variants: d.sizes.map((size, j) => ({
        id: `${id}-v-${j}`,
        productId: id,
        size,
        color: null,
        sku: null,
        stock: d.stock[j] ?? 0,
        sortOrder: j,
        isActive: true,
      })),
      brand: null,
      category,
      reviews: [],
    };
  });
  return products;
}
