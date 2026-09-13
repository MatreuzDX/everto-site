import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/ui/rich-text";
import { prisma, safe } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { LEGAL_LINKS, LIVRO_RECLAMACOES_URL } from "@/lib/site";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  if (!LEGAL_LINKS.some((l) => l.slug === slug)) return null;
  const page = await safe(() => prisma.legalPage.findUnique({ where: { slug } }), null);
  return page ?? { slug, title: LEGAL_LINKS.find((l) => l.slug === slug)!.label, content: "", updatedAt: null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await load((await params).slug);
  if (!page) return {};
  return { title: page.title, alternates: { canonical: `/legal/${page.slug}` }, robots: page.content ? undefined : { index: false } };
}

export default async function LegalPage({ params }: Props) {
  const page = await load((await params).slug);
  if (!page) notFound();
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-8 md:px-6 md:pt-12">
      <p className="tag text-muted">Informação legal</p>
      <h1 className="display mt-2 text-5xl md:text-7xl">{page.title}</h1>
      {page.updatedAt && page.content && <p className="tag mt-3 text-muted">Atualizado a {formatDate(page.updatedAt)}</p>}

      <div className="mt-8">
        {page.content ? (
          <RichText content={page.content} />
        ) : (
          <p className="border border-dashed border-ink/25 p-6 text-muted">
            Esta página está a ser preparada. Para qualquer questão, <Link href="/contacto" className="underline">contacta-nos</Link>.
          </p>
        )}
      </div>

      <aside className="mt-12 border-t border-ink/10 pt-6 text-sm text-ink/80">
        {(settings.legalName || settings.nif || settings.address) && (
          <p>
            {settings.legalName}
            {settings.nif && ` · NIF ${settings.nif}`}
            {settings.address && ` · ${settings.address}`}
          </p>
        )}
        <p className="mt-2">
          Livro de Reclamações Eletrónico:{" "}
          <a href={LIVRO_RECLAMACOES_URL} target="_blank" rel="noopener noreferrer" className="underline">
            livroreclamacoes.pt
          </a>
        </p>
        {settings.ralName && (
          <p className="mt-2">
            Entidade de Resolução Alternativa de Litígios:{" "}
            {settings.ralUrl ? (
              <a href={settings.ralUrl} target="_blank" rel="noopener noreferrer" className="underline">{settings.ralName}</a>
            ) : (
              settings.ralName
            )}
          </p>
        )}
      </aside>
    </div>
  );
}
