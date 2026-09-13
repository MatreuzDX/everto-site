import type { MetadataRoute } from "next";
import { prisma, safe } from "@/lib/db";
import { LEGAL_LINKS, SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, legal] = await Promise.all([
    safe(() => prisma.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }), []),
    safe(() => prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }), []),
    safe(() => prisma.legalPage.findMany({ where: { content: { not: "" } }, select: { slug: true, updatedAt: true } }), []),
  ]);

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/produtos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/contacto`, changeFrequency: "monthly", priority: 0.3 },
    ...categories.map((c) => ({ url: `${SITE_URL}/categoria/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/produto/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...legal
      .filter((l) => LEGAL_LINKS.some((x) => x.slug === l.slug))
      .map((l) => ({ url: `${SITE_URL}/legal/${l.slug}`, lastModified: l.updatedAt, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
