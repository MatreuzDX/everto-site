import { X } from "lucide-react";
import Link from "next/link";
import { ProductGrid } from "@/components/product/product-card";
import {
  getAllCategories,
  getFilterOptions,
  searchProducts,
  SORT_OPTIONS,
  type CatalogParams,
} from "@/lib/catalog";
import { Filters } from "./filters";

function buildHref(base: string, params: CatalogParams, change: Partial<CatalogParams>) {
  const merged: Record<string, string | undefined> = { ...params, ...change };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) if (value) search.set(key, value);
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

const FLAG_LABELS: Partial<Record<keyof CatalogParams, string>> = {
  novidade: "Novidades",
  promo: "Promoções",
  disponivel: "Em stock",
  exclusivo: "Exclusivos",
};

export async function CatalogView({
  basePath,
  params,
  title,
  eyebrow,
  description,
  lockCategory,
}: {
  basePath: string;
  params: CatalogParams;
  title: string;
  eyebrow?: string;
  description?: string | null;
  lockCategory?: boolean;
}) {
  const [result, options, categories] = await Promise.all([
    searchProducts(params),
    getFilterOptions(),
    getAllCategories(),
  ]);

  const chips: { label: string; href: string }[] = [];
  const unset = (key: keyof CatalogParams) => buildHref(basePath, params, { [key]: undefined, pagina: undefined });
  if (params.q) chips.push({ label: `“${params.q}”`, href: unset("q") });
  if (params.categoria && !lockCategory) {
    const c = categories.find((x) => x.slug === params.categoria);
    chips.push({ label: c?.name ?? params.categoria, href: unset("categoria") });
  }
  if (params.marca) {
    const b = options.brands.find((x) => x.slug === params.marca);
    chips.push({ label: b?.name ?? params.marca, href: unset("marca") });
  }
  if (params.tamanho) chips.push({ label: `Tam. ${params.tamanho}`, href: unset("tamanho") });
  if (params.cor) chips.push({ label: params.cor, href: unset("cor") });
  if (params.min) chips.push({ label: `Desde ${params.min}€`, href: unset("min") });
  if (params.max) chips.push({ label: `Até ${params.max}€`, href: unset("max") });
  for (const [key, label] of Object.entries(FLAG_LABELS)) {
    if (params[key as keyof CatalogParams]) chips.push({ label: label!, href: unset(key as keyof CatalogParams) });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 md:px-6 md:pt-12">
      <div className="mb-6 md:mb-10">
        {eyebrow && <p className="tag mb-2 text-muted">{eyebrow}</p>}
        <h1 className="display text-6xl md:text-8xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-muted">{description}</p>}
      </div>

      <div className="sticky top-16 z-30 -mx-4 mb-6 flex items-center gap-2 border-y border-ink/10 bg-paper/95 px-4 py-2 backdrop-blur md:top-[4.5rem] md:mx-0 md:px-0">
        <Filters
          basePath={basePath}
          params={params}
          lockCategory={lockCategory}
          categories={categories.map((c) => ({ slug: c.slug, name: c.name, parentId: c.parentId, id: c.id }))}
          brands={options.brands}
          sizes={options.sizes}
          colors={options.colors}
          sortOptions={[...SORT_OPTIONS]}
        />
        <p className="tag ml-auto text-muted">
          {result.total} {result.total === 1 ? "produto" : "produtos"}
        </p>
      </div>

      {chips.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Link key={chip.label} href={chip.href} className="flex items-center gap-1.5 bg-ink px-3 py-1.5 text-xs font-semibold text-paper">
              {chip.label} <X className="h-3.5 w-3.5" aria-label="remover filtro" />
            </Link>
          ))}
          <Link href={basePath} className="px-2 py-1.5 text-xs font-semibold underline">
            Limpar tudo
          </Link>
        </div>
      )}

      {result.items.length === 0 ? (
        <div className="border-2 border-dashed border-ink/20 px-6 py-16 text-center">
          <p className="display text-4xl">Nada por aqui</p>
          <p className="mt-2 text-muted">
            {chips.length > 0 ? "Experimenta tirar alguns filtros." : "Os produtos desta secção estão a chegar."}
          </p>
          {chips.length > 0 && (
            <Link href={basePath} className="btn btn-primary mt-6">
              Limpar filtros
            </Link>
          )}
        </div>
      ) : (
        <ProductGrid products={result.items} priorityCount={4} />
      )}

      {result.pages > 1 && (
        <nav aria-label="Paginação" className="mt-12 flex items-center justify-center gap-2">
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={buildHref(basePath, params, { pagina: n === 1 ? undefined : String(n) })}
              aria-current={n === result.page ? "page" : undefined}
              className={`grid h-11 min-w-11 place-items-center px-3 text-sm font-bold ${n === result.page ? "bg-ink text-paper" : "border border-ink/20"}`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
