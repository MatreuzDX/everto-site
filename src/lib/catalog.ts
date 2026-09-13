import type { Category, Prisma } from "@prisma/client";
import { cache } from "react";
import { compareSizes } from "./catalog-shared";
import { prisma, safe } from "./db";
import { demoCategories, demoMode, demoProducts, type DemoProduct } from "./demo-store";

// ─── Cartões de produto ──────────────────────────────────────

const cardInclude = {
  images: { orderBy: { sortOrder: "asc" }, take: 2, select: { url: true, alt: true } },
  variants: { where: { isActive: true }, select: { stock: true, size: true } },
  brand: { select: { name: true } },
} satisfies Prisma.ProductInclude;

type CardSource = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  priceCents: number;
  salePriceCents: number | null;
  image: { url: string; alt: string | null } | null;
  hoverImage: string | null;
  totalStock: number;
  lowStock: boolean;
  sizes: string[];
  isNew: boolean;
  isLimited: boolean;
  rating: { average: number; count: number } | null;
};

export { compareSizes };

function toCard(p: CardSource): ProductCardData {
  const totalStock = p.variants.reduce((sum, v) => sum + Math.max(v.stock, 0), 0);
  const sizes = [
    ...new Set(p.variants.filter((v) => v.stock > 0 && v.size).map((v) => v.size!)),
  ].sort(compareSizes);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand?.name ?? null,
    priceCents: p.priceCents,
    salePriceCents: p.salePriceCents,
    image: p.images[0] ?? null,
    hoverImage: p.images[1]?.url ?? null,
    totalStock,
    lowStock: totalStock > 0 && totalStock <= p.lowStockThreshold,
    sizes,
    isNew: p.isNew,
    isLimited: p.isLimited,
    rating: null,
  };
}

async function withRatings(cards: ProductCardData[]) {
  if (cards.length === 0) return cards;
  const groups = await prisma.review.groupBy({
    by: ["productId"],
    where: { status: "APPROVED", productId: { in: cards.map((c) => c.id) } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const map = new Map(groups.map((g) => [g.productId, g]));
  return cards.map((c) => {
    const g = map.get(c.id);
    return g ? { ...c, rating: { average: g._avg.rating ?? 0, count: g._count._all } } : c;
  });
}

async function cards(args: Omit<Prisma.ProductFindManyArgs, "include" | "select">) {
  const rows = await prisma.product.findMany({ ...args, include: cardInclude });
  return withRatings(rows.map(toCard));
}

const ACTIVE = { status: "ACTIVE" } satisfies Prisma.ProductWhereInput;

// ─── Categorias ──────────────────────────────────────────────

export const getAllCategories = cache(async (): Promise<Category[]> =>
  demoMode() ? demoCategories() : safe(
    () =>
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
    [],
  ),
);

export type CategoryNode = Category & { children: Category[] };

export async function getCategoryTree(): Promise<CategoryNode[]> {
  const all = await getAllCategories();
  return all
    .filter((c) => !c.parentId)
    .map((root) => ({ ...root, children: all.filter((c) => c.parentId === root.id) }));
}

export async function descendantIds(categoryId: string): Promise<string[]> {
  const all = await getAllCategories();
  const ids = [categoryId];
  for (let i = 0; i < ids.length; i++) {
    for (const c of all) if (c.parentId === ids[i]) ids.push(c.id);
  }
  return ids;
}

export async function getCategoryBySlug(slug: string) {
  const all = await getAllCategories();
  const category = all.find((c) => c.slug === slug);
  if (!category) return null;
  return {
    ...category,
    parent: all.find((c) => c.id === category.parentId) ?? null,
    children: all.filter((c) => c.parentId === category.id),
  };
}

// ─── Homepage ────────────────────────────────────────────────

async function productsInCategory(slug: string, take: number) {
  const category = await getCategoryBySlug(slug);
  if (!category) return [];
  if (demoMode()) {
    const ids = await descendantIds(category.id);
    return demoProducts()
      .filter((p) => p.categoryId && ids.includes(p.categoryId))
      .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || +b.createdAt - +a.createdAt)
      .slice(0, take)
      .map(toCard);
  }
  return cards({
    where: { ...ACTIVE, categoryId: { in: await descendantIds(category.id) } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take,
  });
}

export async function getHomeData() {
  if (demoMode()) {
    const all = demoProducts();
    const byDate = [...all].sort((a, b) => +b.createdAt - +a.createdAt);
    const [football, streetwear, sneakers] = await Promise.all([
      productsInCategory("futebol", 8),
      productsInCategory("roupas", 8),
      productsInCategory("sneakers", 8),
    ]);
    return {
      newDrops: byDate.filter((p) => p.isNew).slice(0, 8).map(toCard),
      bestSellers: all.filter((p) => p.isBestSeller).slice(0, 8).map(toCard),
      lastUnits: all.map(toCard).filter((c) => c.lowStock).slice(0, 8),
      featured: (all.find((p) => p.isFeatured) ? toCard(all.find((p) => p.isFeatured)!) : null) as ProductCardData | null,
      football,
      streetwear,
      sneakers,
      total: all.length,
    };
  }
  return safe(
    async () => {
      const [newDrops, bestSellers, lowStockCandidates, featured, football, streetwear, sneakers, total] =
        await Promise.all([
          cards({ where: { ...ACTIVE, isNew: true }, orderBy: { createdAt: "desc" }, take: 8 }),
          cards({
            where: { ...ACTIVE, OR: [{ isBestSeller: true }, { soldCount: { gt: 0 } }] },
            orderBy: [{ isBestSeller: "desc" }, { soldCount: "desc" }],
            take: 8,
          }),
          cards({
            where: { ...ACTIVE, variants: { some: { isActive: true, stock: { gt: 0, lte: 5 } } } },
            orderBy: { updatedAt: "desc" },
            take: 40,
          }),
          cards({ where: { ...ACTIVE, isFeatured: true }, orderBy: { updatedAt: "desc" }, take: 1 }),
          productsInCategory("futebol", 8),
          productsInCategory("roupas", 8),
          productsInCategory("sneakers", 8),
          prisma.product.count({ where: ACTIVE }),
        ]);
      return {
        newDrops,
        bestSellers,
        lastUnits: lowStockCandidates.filter((c) => c.lowStock).slice(0, 8),
        featured: (featured[0] ?? null) as ProductCardData | null,
        football,
        streetwear,
        sneakers,
        total,
      };
    },
    {
      newDrops: [],
      bestSellers: [],
      lastUnits: [],
      featured: null as ProductCardData | null,
      football: [],
      streetwear: [],
      sneakers: [],
      total: 0,
    },
  );
}

// ─── Catálogo com filtros ────────────────────────────────────

export type CatalogParams = {
  q?: string;
  categoria?: string;
  marca?: string;
  tamanho?: string;
  cor?: string;
  min?: string;
  max?: string;
  disponivel?: string;
  novidade?: string;
  promo?: string;
  exclusivo?: string;
  ordem?: string;
  pagina?: string;
};

export const PAGE_SIZE = 24;

export const SORT_OPTIONS = [
  { value: "relevancia", label: "Relevância" },
  { value: "recentes", label: "Mais recentes" },
  { value: "vendidos", label: "Mais vendidos" },
  { value: "preco-asc", label: "Menor preço" },
  { value: "preco-desc", label: "Maior preço" },
] as const;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeParams(raw: Record<string, string | string[] | undefined>): CatalogParams {
  const keys: (keyof CatalogParams)[] = [
    "q", "categoria", "marca", "tamanho", "cor", "min", "max",
    "disponivel", "novidade", "promo", "exclusivo", "ordem", "pagina",
  ];
  const out: CatalogParams = {};
  for (const key of keys) {
    const value = first(raw[key])?.trim().slice(0, 100);
    if (value) out[key] = value;
  }
  return out;
}

async function demoSearch(params: CatalogParams) {
  let list: DemoProduct[] = demoProducts();
  if (params.q) {
    const q = params.q.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category?.name.toLowerCase().includes(q));
  }
  if (params.categoria) {
    const category = await getCategoryBySlug(params.categoria);
    const ids = category ? await descendantIds(category.id) : [];
    list = list.filter((p) => p.categoryId && ids.includes(p.categoryId));
  }
  if (params.marca) list = [];
  if (params.tamanho) list = list.filter((p) => p.variants.some((v) => v.size === params.tamanho && v.stock > 0));
  if (params.disponivel) list = list.filter((p) => p.variants.some((v) => v.stock > 0));
  const min = Number(params.min);
  const max = Number(params.max);
  if (params.min && Number.isFinite(min)) list = list.filter((p) => p.effectivePriceCents >= min * 100);
  if (params.max && Number.isFinite(max)) list = list.filter((p) => p.effectivePriceCents <= max * 100);
  if (params.novidade) list = list.filter((p) => p.isNew);
  if (params.promo) list = list.filter((p) => p.salePriceCents != null);
  if (params.exclusivo) list = list.filter((p) => p.isLimited);

  const sorted = [...list].sort((a, b) => {
    switch (params.ordem) {
      case "recentes":
        return +b.createdAt - +a.createdAt;
      case "vendidos":
        return Number(b.isBestSeller) - Number(a.isBestSeller);
      case "preco-asc":
        return a.effectivePriceCents - b.effectivePriceCents;
      case "preco-desc":
        return b.effectivePriceCents - a.effectivePriceCents;
      default:
        return Number(b.isFeatured) - Number(a.isFeatured) || Number(b.isNew) - Number(a.isNew) || +b.createdAt - +a.createdAt;
    }
  });
  const page = Math.max(1, Number(params.pagina) || 1);
  return {
    items: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(toCard),
    total: sorted.length,
    page,
    pages: Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)),
  };
}

export async function searchProducts(params: CatalogParams) {
  if (demoMode()) return demoSearch(params);
  const where: Prisma.ProductWhereInput[] = [ACTIVE];

  if (params.q) {
    const q = params.q;
    where.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { name: { contains: q, mode: "insensitive" } } },
        { model: { contains: q, mode: "insensitive" } },
        { collection: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (params.categoria) {
    const category = await getCategoryBySlug(params.categoria);
    where.push({ categoryId: { in: category ? await descendantIds(category.id) : [] } });
  }
  if (params.marca) where.push({ brand: { slug: params.marca } });
  if (params.tamanho || params.cor || params.disponivel) {
    where.push({
      variants: {
        some: {
          isActive: true,
          ...(params.tamanho ? { size: params.tamanho } : {}),
          ...(params.cor ? { color: { equals: params.cor, mode: "insensitive" } } : {}),
          ...(params.disponivel || params.tamanho ? { stock: { gt: 0 } } : {}),
        },
      },
    });
  }
  const min = Number(params.min);
  const max = Number(params.max);
  if (params.min && Number.isFinite(min)) where.push({ effectivePriceCents: { gte: Math.round(min * 100) } });
  if (params.max && Number.isFinite(max)) where.push({ effectivePriceCents: { lte: Math.round(max * 100) } });
  if (params.novidade) where.push({ isNew: true });
  if (params.promo) where.push({ salePriceCents: { not: null } });
  if (params.exclusivo) where.push({ isLimited: true });

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
    switch (params.ordem) {
      case "recentes":
        return [{ createdAt: "desc" }];
      case "vendidos":
        return [{ soldCount: "desc" }, { isBestSeller: "desc" }];
      case "preco-asc":
        return [{ effectivePriceCents: "asc" }];
      case "preco-desc":
        return [{ effectivePriceCents: "desc" }];
      default:
        return [{ isFeatured: "desc" }, { isNew: "desc" }, { createdAt: "desc" }];
    }
  })();

  const page = Math.max(1, Number(params.pagina) || 1);

  return safe(
    async () => {
      const [items, total] = await Promise.all([
        cards({ where: { AND: where }, orderBy, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
        prisma.product.count({ where: { AND: where } }),
      ]);
      return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
    },
    { items: [] as ProductCardData[], total: 0, page, pages: 1 },
  );
}

export async function getFilterOptions() {
  if (demoMode()) {
    const sizes = [...new Set(demoProducts().flatMap((p) => p.variants.map((v) => v.size!)))].sort(compareSizes);
    return { brands: [] as { name: string; slug: string }[], sizes, colors: [] as string[] };
  }
  return safe(
    async () => {
      const [brands, variants] = await Promise.all([
        prisma.brand.findMany({
          where: { products: { some: ACTIVE } },
          orderBy: { name: "asc" },
          select: { name: true, slug: true },
        }),
        prisma.productVariant.findMany({
          where: { isActive: true, product: ACTIVE },
          select: { size: true, color: true },
          distinct: ["size", "color"],
        }),
      ]);
      const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean) as string[])].sort(compareSizes);
      const colors = [...new Set(variants.map((v) => v.color).filter(Boolean) as string[])].sort();
      return { brands, sizes, colors };
    },
    { brands: [], sizes: [], colors: [] },
  );
}

// ─── Página de produto ───────────────────────────────────────

export async function getProductBySlug(slug: string) {
  if (demoMode()) return demoProducts().find((p) => p.slug === slug) ?? null;
  return safe(
    () =>
      prisma.product.findFirst({
        where: { slug, status: "ACTIVE" },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
          brand: true,
          category: true,
          reviews: {
            where: { status: "APPROVED" },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: { user: { select: { name: true } } },
          },
        },
      }),
    null,
  );
}

export async function getRelatedProducts(productId: string, categoryId: string | null) {
  if (!categoryId) return [];
  if (demoMode()) {
    return demoProducts()
      .filter((p) => p.categoryId === categoryId && p.id !== productId)
      .slice(0, 4)
      .map(toCard);
  }
  return safe(
    () =>
      cards({
        where: { ...ACTIVE, categoryId, id: { not: productId } },
        orderBy: [{ isBestSeller: "desc" }, { createdAt: "desc" }],
        take: 4,
      }),
    [],
  );
}

export async function getCardsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  if (demoMode()) return demoProducts().filter((p) => ids.includes(p.id)).map(toCard);
  return safe(() => cards({ where: { ...ACTIVE, id: { in: ids.slice(0, 100) } } }), []);
}
