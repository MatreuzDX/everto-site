"use client";

import { Boxes, LayoutDashboard, Package, Settings, ShoppingCart, Tags, UserCog, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/admin", label: "Painel", icon: LayoutDashboard },
    { href: "/admin/encomendas", label: "Encomendas", icon: ShoppingCart },
    { href: "/admin/produtos", label: "Produtos", icon: Package },
    { href: "/admin/stock", label: "Stock", icon: Boxes },
    { href: "/admin/categorias", label: "Categorias e marcas", icon: Tags },
    ...(isAdmin
      ? [
          { href: "/admin/clientes", label: "Clientes", icon: Users },
          { href: "/admin/utilizadores", label: "Equipa", icon: UserCog },
          { href: "/admin/definicoes", label: "Definições", icon: Settings },
        ]
      : []),
  ];

  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto px-2 pb-2 md:flex-1 md:flex-col md:overflow-visible md:pb-0">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-3 px-3 py-2.5 text-sm font-medium ${active ? "bg-brand text-ink" : "text-paper/75 hover:bg-paper/10 hover:text-paper"}`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
