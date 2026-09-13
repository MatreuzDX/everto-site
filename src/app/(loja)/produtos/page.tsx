import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/catalog-view";
import { normalizeParams } from "@/lib/catalog";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = normalizeParams(await searchParams);
  const filtered = Object.keys(params).some((k) => k !== "pagina");
  return {
    title: params.q ? `Pesquisa: ${params.q}` : params.novidade ? "Novidades" : "Todos os produtos",
    description: "Camisolas de futebol, streetwear, sneakers e acessórios importados.",
    alternates: { canonical: "/produtos" },
    // Combinações de filtros não entram no índice — evita conteúdo duplicado.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = normalizeParams(await searchParams);
  const title = params.q
    ? `“${params.q}”`
    : params.novidade
      ? "Novidades"
      : params.exclusivo
        ? "Exclusivos"
        : params.promo
          ? "Promoções"
          : "Loja";
  return <CatalogView basePath="/produtos" params={params} title={title} eyebrow={params.q ? "Pesquisa" : "Catálogo"} />;
}
