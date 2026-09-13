"use client";

import { Heart, Search, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/components/store/store-provider";

export function HeaderActions() {
  const { cartCount, wishlist, setCartOpen, ready } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  return (
    <>
      <div className="ml-auto flex items-center">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="grid h-11 w-11 place-items-center hover:bg-ink/5"
          aria-label="Pesquisar"
        >
          <Search className="h-5 w-5" />
        </button>
        <Link href="/favoritos" className="relative hidden h-11 w-11 place-items-center hover:bg-ink/5 sm:grid" aria-label="Favoritos">
          <Heart className="h-5 w-5" />
          {ready && wishlist.length > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-ink" aria-hidden />
          )}
        </Link>
        <Link href="/account" className="grid h-11 w-11 place-items-center hover:bg-ink/5" aria-label="A minha conta">
          <User className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="relative grid h-11 w-11 place-items-center hover:bg-ink/5"
          aria-label={`Carrinho, ${cartCount} artigos`}
        >
          <ShoppingBag className="h-5 w-5" />
          {ready && cartCount > 0 && (
            <span
              key={cartCount}
              className="animate-fade-up absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-lime px-1 text-[0.68rem] font-bold text-ink ring-2 ring-paper"
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <form
            role="search"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const q = inputRef.current?.value.trim();
              setSearchOpen(false);
              router.push(q ? `/produtos?q=${encodeURIComponent(q)}` : "/produtos");
            }}
            className="animate-fade-up bg-paper"
          >
            <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 md:py-6">
              <Search className="h-6 w-6 shrink-0" aria-hidden />
              <input
                ref={inputRef}
                name="q"
                type="search"
                placeholder="Procurar camisolas, sneakers, marcas…"
                className="display h-12 w-full bg-transparent text-2xl outline-none placeholder:text-muted/60 md:text-4xl"
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="grid h-11 w-11 place-items-center" aria-label="Fechar pesquisa">
                <X className="h-6 w-6" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
