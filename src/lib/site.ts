export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Link oficial e obrigatório do Livro de Reclamações Eletrónico. */
export const LIVRO_RECLAMACOES_URL = "https://www.livroreclamacoes.pt/";

export const LEGAL_LINKS = [
  { slug: "termos", label: "Termos e condições" },
  { slug: "privacidade", label: "Privacidade" },
  { slug: "cookies", label: "Cookies" },
  { slug: "trocas-devolucoes", label: "Trocas e devoluções" },
  { slug: "envios", label: "Envios" },
] as const;
