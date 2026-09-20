import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { requireStaff } from "@/lib/auth";
import { logoutAction } from "../(loja)/(auth)/actions";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="min-h-dvh bg-[#f6f5f1] md:grid md:grid-cols-[232px_1fr]">
      <aside className="bg-ink text-paper md:sticky md:top-0 md:flex md:h-dvh md:flex-col">
        <div className="flex h-14 items-center gap-2 px-4 md:h-16">
          <LogoMark className="h-8 w-8 text-brand" />
          <span className="display text-xl">Admin</span>
          <Link href="/" target="_blank" className="tag ml-auto text-paper/60 hover:text-paper">
            Ver loja ↗
          </Link>
        </div>
        <AdminNav isAdmin={isAdmin} />
        <div className="hidden border-t border-paper/10 p-4 text-xs md:block">
          <p className="truncate font-semibold">{user.name}</p>
          <p className="tag mt-0.5 text-brand">{user.role}</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="text-paper/60 underline hover:text-paper">
              Terminar sessão
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
