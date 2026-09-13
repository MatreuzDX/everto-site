import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/catalog-view";
import { getCategoryBySlug, normalizeParams } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [category, settings] = await Promise.all([getCategoryBySlug(slug), getSettings()]);
  if (!category) return {};
  const filtered = Object.keys(normalizeParams(await searchParams)).length > 0;
  return {
    title: category.seoTitle || category.name,
    description:
      category.seoDescription ||
      category.description ||
      `${category.name} na ${settings.storeName}. Stock por tamanho, novos drops e compra pelo site ou WhatsApp.`,
    alternates: { canonical: `/categoria/${category.slug}` },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const query = { ...normalizeParams(await searchParams), categoria: category.slug };

  const crumbs = [
    { name: "Início", url: "/" },
    ...(category.parent ? [{ name: category.parent.name, url: `/categoria/${category.parent.slug}` }] : []),
    { name: category.name, url: `/categoria/${category.slug}` },
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(c.url) })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {category.children.length > 0 && (
        <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pt-6 md:px-6">
          {category.children.map((child) => (
            <Link key={child.id} href={`/categoria/${child.slug}`} className="tag shrink-0 border border-ink/20 px-3 py-2 hover:bg-ink hover:text-paper">
              {child.name}
            </Link>
          ))}
        </div>
      )}
      <CatalogView
        basePath={`/categoria/${category.slug}`}
        params={query}
        title={category.name}
        eyebrow={category.parent?.name ?? "Categoria"}
        description={category.description}
        lockCategory
      />
    </>
  );
}
