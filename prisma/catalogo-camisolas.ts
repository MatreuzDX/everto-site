/**
 * Catálogo das 35 fotos recebidas do Everton pelo WhatsApp, agrupadas em
 * 22 camisolas distintas (várias fotos repetiam a mesma camisola).
 *
 * Modelo do negócio (confirmado pelo Mateus, 20/09/2026): feito por
 * encomenda, sem stock limitado — "se o cliente quiser pedir mil, a gente
 * faz mil". Por isso o stock não é um número real e contável; usa-se um
 * teto técnico alto (STOCK_SEMPRE_DISPONIVEL) só para o checkout nunca
 * bloquear a compra nem mostrar "últimas unidades".
 *
 * As imagens (campo `photos`) ainda apontam para os ficheiros locais em
 * whatsapp-fotos/. Antes de correr o seed real, trocar por scripts/
 * subir-fotos-blob.ts, que faz o upload para o Vercel Blob e substitui
 * este campo pelos URLs públicos.
 *
 * NÃO publicar (status ACTIVE) sem:
 *   1. Vercel Blob ligado ao projeto (photos com URL real).
 *   2. DATABASE_URL colado na Vercel (senão nada disto aparece no site).
 *   3. Preço da Inter Milão retro confirmado (fica null propositadamente).
 *   4. Tamanhos da Benfica Kids confirmados (fica null propositadamente).
 */

export const STOCK_SEMPRE_DISPONIVEL = 999;
export const TAMANHOS_ADULTO = ["S", "M", "L", "XL", "XXL"];
export const PRECO_PADRAO_CENTS = 2500; // 25,00 €

export type ItemCatalogo = {
  name: string;
  category: "camisolas-clubes" | "camisolas-selecoes" | "retro";
  priceCents: number | null; // null = por confirmar, NÃO inventar
  sizes: string[] | null; // null = por confirmar (ex.: Benfica Kids)
  photos: string[]; // ficheiros em whatsapp-fotos/
  note?: string;
};

export const CATALOGO: ItemCatalogo[] = [
  { name: "Camisola Brasil Home", category: "camisolas-selecoes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-01.jpg", "foto-05.jpg", "foto-25.jpg"] },
  { name: "Camisola Brasil Away", category: "camisolas-selecoes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-06.jpg", "foto-35.jpg"] },
  { name: "Camisola Flamengo Home", category: "camisolas-clubes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-02.jpg", "foto-07.jpg"] },
  { name: "Camisola Flamengo Away", category: "camisolas-clubes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-03.jpg", "foto-08.jpg"] },
  { name: "Camisola Sporting CP Home", category: "camisolas-clubes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-09.jpg", "foto-22.jpg"] },
  { name: "Camisola Sporting CP 120 Anos", category: "camisolas-clubes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-24.jpg"] },
  { name: "Camisola Dinamarca Home", category: "camisolas-selecoes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-10.jpg", "foto-20.jpg", "foto-29.jpg"] },
  { name: "Camisola Portugal Home", category: "camisolas-selecoes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-11.jpg", "foto-28.jpg"] },
  { name: "Camisola Portugal Edição Especial", category: "camisolas-selecoes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-18.jpg"] },
  { name: "Camisola Arsenal Home", category: "camisolas-clubes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-12.jpg", "foto-14.jpg"] },
  { name: "Camisola FC Porto Home", category: "camisolas-clubes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-13.jpg", "foto-34.jpg"] },
  { name: "Camisola Benfica Kids", category: "camisolas-clubes", priceCents: PRECO_PADRAO_CENTS, sizes: null, photos: ["foto-15.jpg"], note: "Tamanhos infantis (a foto indica 16-28) — confirmar tabela de tamanhos com o Everton antes de publicar." },
  { name: "Camisola Real Madrid Away", category: "camisolas-clubes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-16.jpg"] },
  { name: "Camisola Real Madrid Home", category: "camisolas-clubes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-26.jpg"] },
  { name: "Camisola Manchester City Home", category: "camisolas-clubes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-17.jpg"] },
  { name: "Camisola Noruega Home", category: "camisolas-selecoes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-19.jpg"] },
  { name: "Camisola Barcelona Home", category: "camisolas-clubes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-21.jpg"] },
  { name: "Camisola Espanha Away", category: "camisolas-selecoes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-23.jpg"] },
  { name: "Camisola Espanha Home", category: "camisolas-selecoes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-33.jpg"] },
  { name: "Camisola Benfica Edição Especial", category: "camisolas-clubes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-27.jpg"] },
  { name: "Camisola Azul e Branca (clube a confirmar)", category: "camisolas-clubes", priceCents: PRECO_PADRAO_CENTS, sizes: TAMANHOS_ADULTO, photos: ["foto-04.jpg"], note: "Crest 'SC' com lobo, marca Lobo — não consegui identificar o clube com confiança. Confirmar nome com o Everton." },
  { name: "Camisola Inter Milão Retro 01/02", category: "retro", priceCents: null, sizes: TAMANHOS_ADULTO, photos: ["foto-30.jpg", "foto-31.jpg", "foto-32.jpg"], note: "Esta é a 'do Milan retro' que o Everton mencionou no áudio — preço diferente dos 25€, mas o valor não ficou percetível. Confirmar preço antes de publicar." },
];

export const TOTAL_FOTOS = CATALOGO.reduce((n, i) => n + i.photos.length, 0);
