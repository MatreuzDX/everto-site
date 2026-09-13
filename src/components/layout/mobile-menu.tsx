"use client";

import { ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { CategoryNode } from "@/lib/catalog";

export function MobileMenu({ tree, instagramUrl }: { tree: CategoryNode[]; instagramUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fechar ao navegar
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-ml-2 grid h-11 w-11 place-items-center lg:hidden"
        aria-label="Abrir menu"
        aria-expanded={open}
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <nav
            aria-label="Menu"
            className="animate-fade-up absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-ink text-paper"
          >
            <div className="flex h-16 items-center justify-between border-b border-paper/10 px-4">
              <span className="tag text-lime">Menu</span>
              <button type="button" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center" aria-label="Fechar menu">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <Link href="/produtos?novidade=1" className="display block py-3 text-4xl text-lime">
                Novidades
              </Link>
              <Link href="/produtos" className="display block py-3 text-4xl">
                Ver tudo
              </Link>
              {tree.map((c) => (
                <div key={c.id} className="border-t border-paper/10">
                  <div className="flex items-center">
                    <Link href={`/categoria/${c.slug}`} className="display flex-1 py-3 text-4xl">
                      {c.name}
                    </Link>
                    {c.children.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                        className="grid h-11 w-11 place-items-center"
                        aria-label={`Subcategorias de ${c.name}`}
                        aria-expanded={expanded === c.id}
                      >
                        <ChevronRight className={`h-5 w-5 transition ${expanded === c.id ? "rotate-90" : ""}`} />
                      </button>
                    )}
                  </div>
                  {expanded === c.id && (
                    <div className="grid grid-cols-2 gap-x-3 pb-4">
                      {c.children.map((child) => (
                        <Link key={child.id} href={`/categoria/${child.slug}`} className="py-2 text-sm text-paper/80">
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-6 grid gap-2 border-t border-paper/10 pt-6 text-sm">
                <Link href="/produtos?exclusivo=1">Exclusivos</Link>
                <Link href="/favoritos">Favoritos</Link>
                <Link href="/account">A minha conta</Link>
                <Link href="/contacto">Contacto</Link>
              </div>
            </div>

            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="btn btn-lime m-4">
                Seguir no Instagram
              </a>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
