import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHeader } from "@/components/home/section";
import { BuyBox } from "@/components/product/buy-box";
import { Gallery } from "@/components/product/gallery";
import { ProductRail } from "@/components/product/product-card";
import { Stars } from "@/components/product/stars";
import { getCategoryBySlug, getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { prisma, safe } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado", robots: { index: false } };
  const description =
    product.seoDescription ||
    product.description?.replace(/\s+/g, " ").slice(0, 155) ||
    `${product.name}${product.brand ? ` — ${product.brand.name}` : ""}. Stock por tamanho e compra pelo site ou WhatsApp.`;
  return {
    title: product.seoTitle || product.name,
    description,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: product.images.slice(0, 4).map((i) => ({ url: absoluteUrl(i.url), alt: i.alt ?? product.name })),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [settings, related, ratingAgg, category] = await Promise.all([
    getSettings(),
    getRelatedProducts(product.id, product.categoryId),
    safe(
      () => prisma.review.aggregate({ where: { productId: product.id, status: "APPROVED" }, _avg: { rating: true }, _count: { _all: true } }),
      null,
    ),
    product.category ? getCategoryBySlug(product.category.slug) : Promise.resolve(null),
  ]);

  const url = absoluteUrl(`/produto/${product.slug}`);
  const price = product.salePriceCents ?? product.priceCents;
  const totalStock = product.variants.reduce((s, v) => s + Math.max(0, v.stock), 0);
  const ratingCount = ratingAgg?._count._all ?? 0;

  const crumbs = [
    { name: "Início", url: "/" },
    ...(category?.parent ? [{ name: category.parent.name, url: `/categoria/${category.parent.slug}` }] : []),
    ...(category ? [{ name: category.name, url: `/categoria/${category.slug}` }] : []),
    { name: product.name, url: `/produto/${product.slug}` },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: product.images.map((i) => absoluteUrl(i.url)),
      description: product.description ?? undefined,
      sku: product.sku ?? undefined,
      ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "EUR",
        price: (price / 100).toFixed(2),
        availability: totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
      ...(ratingCount > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: (ratingAgg!._avg.rating ?? 0).toFixed(1),
              reviewCount: ratingCount,
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(c.url) })),
    },
  ];

  const details = [
    ["Marca", product.brand?.name],
    ["Modelo", product.model],
    ["Coleção", product.collection],
    ["Edição", product.edition],
    ["Origem", product.origin],
    ["Referência", product.sku],
  ].filter((d): d is [string, string] => Boolean(d[1]));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-7xl px-4 pt-4 md:px-6 md:pt-8">
        <nav aria-label="Caminho" className="tag mb-4 hidden flex-wrap gap-2 text-muted md:flex">
          {crumbs.map((c, i) => (
            <span key={c.url} className="flex gap-2">
              {i > 0 && <span aria-hidden>/</span>}
              {i < crumbs.length - 1 ? <Link href={c.url} className="hover:text-ink">{c.name}</Link> : <span className="text-ink">{c.name}</span>}
            </span>
          ))}
        </nav>

        <div className="grid gap-6 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            <Gallery images={product.images.map((i) => ({ url: i.url, alt: i.alt }))} name={product.name} />
          </div>

          <div className="md:col-span-5">
            <div className="md:sticky md:top-24">
              <div className="flex flex-wrap gap-1.5">
                {product.isNew && <span className="tag bg-brand px-2 py-1">Novo</span>}
                {product.isLimited && <span className="tag bg-ink px-2 py-1 text-paper">Edição limitada</span>}
                {product.isBestSeller && <span className="tag border border-ink px-2 py-1">Mais vendido</span>}
              </div>
              {product.brand && <p className="tag mt-4 text-muted">{product.brand.name}</p>}
              <h1 className="display mt-1 text-5xl md:text-6xl">{product.name}</h1>
              {ratingCount > 0 && (
                <a href="#avaliacoes" className="mt-2 inline-block">
                  <Stars value={ratingAgg!._avg.rating ?? 0} count={ratingCount} className="text-sm" />
                </a>
              )}

              <div className="mt-6">
                <BuyBox
                  product={{
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    priceCents: product.priceCents,
                    salePriceCents: product.salePriceCents,
                    imageUrl: product.images[0]?.url ?? null,
                    lowStockThreshold: product.lowStockThreshold,
                  }}
                  variants={product.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock }))}
                  whatsappNumber={settings.whatsappNumber}
                  productUrl={url}
                />
              </div>

              <div className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
                {product.description && (
                  <details open className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between font-bold uppercase tracking-wide">
                      Descrição <span className="transition group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/80">{product.description}</p>
                  </details>
                )}
                {(details.length > 0 || product.importNotes) && (
                  <details className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between font-bold uppercase tracking-wide">
                      Detalhes do artigo <span className="transition group-open:rotate-45">+</span>
                    </summary>
                    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                      {details.map(([k, v]) => (
                        <div key={k} className="contents">
                          <dt className="tag pt-0.5 text-muted">{k}</dt>
                          <dd>{v}</dd>
                        </div>
                      ))}
                    </dl>
                    {product.importNotes && <p className="mt-3 whitespace-pre-line text-sm text-ink/80">{product.importNotes}</p>}
                  </details>
                )}
                {/* Só com confirmação explícita do admin — nunca se presume autenticidade. */}
                {product.authenticityConfirmed && product.authenticityNote && (
                  <details className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between font-bold uppercase tracking-wide">
                      Autenticidade <span className="transition group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 whitespace-pre-line text-sm text-ink/80">{product.authenticityNote}</p>
                  </details>
                )}
                <details className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-bold uppercase tracking-wide">
                    Envios e trocas <span className="transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-ink/80">
                    Consulta as condições de <Link href="/legal/envios" className="underline">envio</Link> e de{" "}
                    <Link href="/legal/trocas-devolucoes" className="underline">trocas e devoluções</Link>.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </div>

        {product.reviews.length > 0 && (
          <section id="avaliacoes" className="mt-20 scroll-mt-24">
            <SectionHeader eyebrow="Compras verificadas" title="Avaliações" />
            <ul className="grid gap-4 md:grid-cols-2">
              {product.reviews.map((r) => (
                <li key={r.id} className="border border-ink/10 bg-white p-5">
                  <Stars value={r.rating} />
                  {r.body && <p className="mt-3 text-sm leading-relaxed">{r.body}</p>}
                  <p className="tag mt-3 text-muted">
                    {r.user.name.split(" ")[0]} · {formatDate(r.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-20">
            <SectionHeader eyebrow="Combina com" title="Também vais gostar" href={product.category ? `/categoria/${product.category.slug}` : "/produtos"} />
            <ProductRail products={related} />
          </section>
        )}
      </div>
    </>
  );
}
