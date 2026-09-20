import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { getCategoryTree } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { LEGAL_LINKS, LIVRO_RECLAMACOES_URL } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

export async function Footer() {
  const [settings, tree] = await Promise.all([getSettings(), getCategoryTree()]);
  const wa = whatsappLink(settings.whatsappNumber);
  const socials = [
    { label: "Instagram", href: settings.instagramUrl },
    { label: "TikTok", href: settings.tiktokUrl },
    { label: "Facebook", href: settings.facebookUrl },
    { label: "WhatsApp", href: wa },
  ].filter((s): s is { label: string; href: string } => Boolean(s.href));

  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 md:px-6">
        <p className="display text-[18vw] leading-[0.8] text-paper/95 md:text-[9rem]">
          Caetano<span className="text-brand">.</span>
        </p>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="tag mb-4 text-brand">Loja</p>
            <ul className="grid gap-2 text-sm text-paper/80">
              <li><Link href="/produtos">Todos os produtos</Link></li>
              <li><Link href="/produtos?novidade=1">Novidades</Link></li>
              {tree.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link href={`/categoria/${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="tag mb-4 text-brand">Ajuda</p>
            <ul className="grid gap-2 text-sm text-paper/80">
              <li><Link href="/contacto">Contacto</Link></li>
              <li><Link href="/account">A minha conta</Link></li>
              {LEGAL_LINKS.map((l) => (
                <li key={l.slug}>
                  <Link href={`/legal/${l.slug}`}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="tag mb-4 text-brand">Segue</p>
            <ul className="grid gap-2 text-sm text-paper/80">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-sm text-paper/70">
            <Logo logoUrl={settings.logoUrl} name={settings.storeName} className="text-paper" />
            {(settings.legalName || settings.nif) && (
              <p className="mt-4">
                {settings.legalName}
                {settings.nif && <><br />NIF {settings.nif}</>}
              </p>
            )}
            {settings.address && <p className="mt-2 whitespace-pre-line">{settings.address}</p>}
            {settings.email && (
              <p className="mt-2">
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </p>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-paper/10 pt-6 text-xs text-paper/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {settings.storeName}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href={LIVRO_RECLAMACOES_URL} target="_blank" rel="noopener noreferrer" className="underline">
              Livro de Reclamações
            </a>
            {settings.ralName && (
              <span>
                Resolução de litígios:{" "}
                {settings.ralUrl ? (
                  <a href={settings.ralUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    {settings.ralName}
                  </a>
                ) : (
                  settings.ralName
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
