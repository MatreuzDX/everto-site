import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { getCategoryTree } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { HeaderActions } from "./header-actions";
import { MobileMenu } from "./mobile-menu";

export async function Header() {
  const [settings, tree] = await Promise.all([getSettings(), getCategoryTree()]);
  const nav = tree.slice(0, 5);

  const ticker = settings.announcement
    ? [settings.announcement]
    : ["Futebol", "Streetwear", "Sneakers", "Acessórios", "Novos drops"];

  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[90] focus:bg-brand focus:p-2">
        Saltar para o conteúdo
      </a>

      <div className="overflow-hidden bg-ink text-paper" aria-hidden={!settings.announcement}>
        <div className="animate-marquee flex w-max whitespace-nowrap py-2">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex">
              {Array.from({ length: 4 }).flatMap((_, i) =>
                ticker.map((t, j) => (
                  <span key={`${copy}-${i}-${j}`} className="tag flex items-center px-5 text-[0.7rem]">
                    {t}
                    <span className="ml-10 text-brand">✦</span>
                  </span>
                )),
              )}
            </div>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:h-[4.5rem] md:px-6">
          <MobileMenu tree={tree} instagramUrl={settings.instagramUrl} />

          <Link href="/" className="shrink-0" aria-label={`${settings.storeName} — início`}>
            <Logo logoUrl={settings.logoUrl} name={settings.storeName} />
          </Link>

          <nav aria-label="Principal" className="ml-8 hidden items-center gap-1 lg:flex">
            <Link href="/produtos?novidade=1" className="px-3 py-2 text-sm font-semibold uppercase tracking-wide hover:text-muted">
              Novidades
            </Link>
            {nav.map((c) => (
              <div key={c.id} className="group relative">
                <Link
                  href={`/categoria/${c.slug}`}
                  className="block px-3 py-2 text-sm font-semibold uppercase tracking-wide hover:text-muted"
                >
                  {c.name}
                </Link>
                {c.children.length > 0 && (
                  <div className="invisible absolute left-0 top-full min-w-56 translate-y-1 border border-ink/10 bg-paper p-2 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {c.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/categoria/${child.slug}`}
                        className="block px-3 py-2 text-sm hover:bg-paper-2"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <HeaderActions />
        </div>
      </header>
    </>
  );
}
