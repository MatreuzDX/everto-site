import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "@/components/home/section";
import { ProductRail } from "@/components/product/product-card";
import { getAllCategories, getHomeData } from "@/lib/catalog";
import { getSettings, instagramHandle, trustItemsOf } from "@/lib/settings";
import { absoluteUrl } from "@/lib/site";

// Página estática regenerada a cada 5 min e logo que o admin grava algo.
export const revalidate = 300;

export default async function HomePage() {
  const [settings, data, categories] = await Promise.all([getSettings(), getHomeData(), getAllCategories()]);
  const handle = instagramHandle(settings.instagramUrl);
  const trust = trustItemsOf(settings);
  const homeCategories = categories.filter((c) => c.showOnHome && !c.parentId);

  const tiles = [
    ...homeCategories.map((c) => ({ key: c.id, label: c.name, href: `/categoria/${c.slug}`, image: c.imageUrl })),
    { key: "novidades", label: "Novidades", href: "/produtos?novidade=1", image: null },
    { key: "exclusivos", label: "Exclusivos", href: "/produtos?exclusivo=1", image: null },
  ];

  const sameAs = [settings.instagramUrl, settings.tiktokUrl, settings.facebookUrl].filter(Boolean);
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.storeName,
    url: absoluteUrl("/"),
    ...(settings.logoUrl ? { logo: absoluteUrl(settings.logoUrl) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(settings.email ? { email: settings.email } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

      {/* ─── HERO ─── */}
      <section className="grain relative isolate overflow-hidden bg-ink text-paper">
        {settings.heroImageUrl && (
          <>
            <Image src={settings.heroImageUrl} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-70" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          </>
        )}
        <div className="mx-auto flex min-h-[calc(100svh-6.5rem)] max-w-7xl flex-col justify-end px-4 pb-10 pt-16 md:min-h-[44rem] md:px-6 md:pb-16">
          <div className="tag mb-6 flex w-fit items-center gap-3 border border-dashed border-paper/40 px-3 py-2 text-paper/80">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand" aria-hidden />
            {settings.tagline || "Futebol · Streetwear · Sneakers"}
          </div>
          <h1 className="display text-[21vw] leading-[0.82] sm:text-[17vw] lg:text-[11.5rem]">
            Caetano
            <br />
            <span className="text-brand">Importz</span>
          </h1>
          <p className="mt-6 max-w-md text-lg font-medium text-paper/85 md:text-xl">
            {settings.heroTitle || "Estilo importado. Identidade única."}
          </p>
          {settings.heroSubtitle && <p className="mt-2 max-w-md text-paper/60">{settings.heroSubtitle}</p>}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/produtos" className="btn btn-brand h-14 sm:px-10">
              Comprar agora <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/produtos?novidade=1" className="btn btn-outline h-14 border-paper/60 hover:bg-paper hover:text-ink sm:px-10">
              Ver novidades
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CATEGORIAS ─── */}
      <section className="mx-auto max-w-7xl px-4 pt-14 md:px-6 md:pt-20">
        <SectionHeader eyebrow="Explorar" title="Categorias" href="/produtos" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {tiles.map((t, i) => (
            <Link
              key={t.key}
              href={t.href}
              className={`group relative flex aspect-square flex-col justify-between overflow-hidden bg-ink p-4 text-paper md:p-5 ${
                i === 0 ? "col-span-2 aspect-[2/1] md:row-span-2 md:aspect-auto" : ""
              }`}
            >
              {t.image && (
                <>
                  <Image src={t.image} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover opacity-60 transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                </>
              )}
              <span className={`tag relative ${i === 0 ? "text-brand" : ""}`}>{String(i + 1).padStart(2, "0")}</span>
              <span className="relative flex items-end justify-between gap-2">
                <span className={`display ${i === 0 ? "text-6xl md:text-8xl" : "text-3xl md:text-5xl"}`}>{t.label}</span>
                <ArrowUpRight className="h-6 w-6 shrink-0 transition group-hover:-translate-y-1 group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {data.total === 0 && (
        <section className="mx-auto mt-14 max-w-7xl px-4 md:px-6">
          <div className="border-2 border-dashed border-ink/25 p-8 text-center md:p-14">
            <p className="tag text-muted">Catálogo</p>
            <p className="display mt-3 text-5xl md:text-7xl">Os primeiros drops estão a chegar</p>
            <p className="mx-auto mt-4 max-w-md text-muted">
              Acompanha as novidades no Instagram enquanto preparamos a loja.
            </p>
            {settings.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-6">
                Ver no Instagram
              </a>
            )}
          </div>
        </section>
      )}

      {data.newDrops.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6 md:pt-24">
          <SectionHeader eyebrow="Acabou de chegar" title="Novos drops" href="/produtos?novidade=1" />
          <ProductRail products={data.newDrops} />
        </section>
      )}

      {data.football.length > 0 && (
        <section className="mt-16 bg-ink py-14 text-paper md:mt-24 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6 [&_article_h3]:text-paper [&_article_.text-muted]:text-paper/60">
            <SectionHeader eyebrow="Clubes · Seleções · Retro" title="Futebol" href="/categoria/futebol" dark />
            <ProductRail products={data.football} />
          </div>
        </section>
      )}

      {data.bestSellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6 md:pt-24">
          <SectionHeader eyebrow="Os preferidos" title="Mais vendidos" href="/produtos?ordem=vendidos" />
          <ProductRail products={data.bestSellers} />
        </section>
      )}

      {data.lastUnits.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6 md:pt-24">
          <div className="border-t-4 border-danger pt-6">
            <SectionHeader eyebrow="Stock a acabar" title="Últimas unidades" href="/produtos?disponivel=1" />
            <ProductRail products={data.lastUnits} />
          </div>
        </section>
      )}

      {data.streetwear.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6 md:pt-24">
          <SectionHeader eyebrow="Roupa urbana" title="Streetwear" href="/categoria/roupas" />
          <ProductRail products={data.streetwear} />
        </section>
      )}

      {data.sneakers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6 md:pt-24">
          <SectionHeader eyebrow="Pés no chão" title="Sneakers" href="/categoria/sneakers" />
          <ProductRail products={data.sneakers} />
        </section>
      )}

      {/* ─── INSTAGRAM ─── */}
      {settings.instagramUrl && (
        <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6 md:pt-24">
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block overflow-hidden bg-ink p-6 text-paper md:p-12"
          >
            <p className="tag text-brand">Siga</p>
            <p className="display mt-2 break-all text-[12vw] leading-[0.85] md:text-[7.5rem]">@{handle ?? "instagram"}</p>
            <span className="mt-6 inline-flex items-center gap-2 border-b-2 border-brand pb-1 font-bold uppercase tracking-wide">
              Drops em primeira mão no Instagram
              <ArrowUpRight className="h-5 w-5 text-brand transition group-hover:-translate-y-1 group-hover:translate-x-1" />
            </span>
          </a>
        </section>
      )}

      {/* ─── CONFIANÇA (só com textos reais definidos no admin) ─── */}
      {trust.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6 md:pt-24">
          <div className="grid gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
            {trust.map((item, i) => (
              <div key={i} className="bg-paper p-6">
                <p className="tag text-muted">{String(i + 1).padStart(2, "0")}</p>
                <p className="display mt-3 text-3xl">{item.title}</p>
                {item.text && <p className="mt-2 text-sm text-muted">{item.text}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
