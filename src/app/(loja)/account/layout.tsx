import type { Metadata } from "next";
import Link from "next/link";
import { isStaff, requireUser } from "@/lib/auth";
import { logoutAction } from "../(auth)/actions";

export const metadata: Metadata = { title: "A minha conta", robots: { index: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const links = [
    { href: "/account", label: "Encomendas" },
    { href: "/account/dados", label: "Dados" },
    { href: "/account/moradas", label: "Moradas" },
    { href: "/favoritos", label: "Favoritos" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-8 md:px-6 md:pt-12">
      <p className="tag text-muted">A minha conta</p>
      <h1 className="display mt-2 text-5xl md:text-7xl">Olá, {user.name.split(" ")[0]}</h1>

      <nav className="no-scrollbar -mx-4 mt-6 flex gap-1 overflow-x-auto border-b border-ink/10 px-4 md:mx-0 md:px-0">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="shrink-0 px-3 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-ink/5">
            {l.label}
          </Link>
        ))}
        {isStaff(user.role) && (
          <Link href="/admin" className="shrink-0 bg-brand px-3 py-3 text-sm font-semibold uppercase tracking-wide">
            Admin
          </Link>
        )}
        <form action={logoutAction} className="ml-auto shrink-0">
          <button type="submit" className="px-3 py-3 text-sm font-semibold uppercase tracking-wide text-muted hover:text-ink">
            Sair
          </button>
        </form>
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
