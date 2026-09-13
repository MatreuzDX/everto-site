"use client";

import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/components/store/store-provider";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQuantity, removeFromCart } = useStore();
  const pathname = usePathname();
  const subtotal = cart.reduce((s, i) => s + i.priceCents * i.quantity, 0);

  useEffect(() => {
    setCartOpen(false);
  }, [pathname, setCartOpen]);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-[65]" role="dialog" aria-modal="true" aria-label="Carrinho">
      <div className="absolute inset-0 bg-ink/50" onClick={() => setCartOpen(false)} />
      <aside className="animate-fade-up absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper">
        <div className="flex h-16 items-center justify-between border-b border-ink/10 px-5">
          <p className="display text-3xl">Carrinho</p>
          <button type="button" onClick={() => setCartOpen(false)} className="grid h-11 w-11 place-items-center" aria-label="Fechar carrinho">
            <X className="h-6 w-6" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-muted" aria-hidden />
            <p className="display text-3xl">Ainda vazio</p>
            <Link href="/produtos" className="btn btn-primary">
              Explorar a loja
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-5">
              {cart.map((item) => (
                <li key={item.variantId} className="flex gap-4 py-4">
                  <Link href={`/produto/${item.slug}`} className="relative h-28 w-22 shrink-0 overflow-hidden bg-paper-2">
                    {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="88px" className="object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={`/produto/${item.slug}`} className="line-clamp-2 text-sm font-semibold">
                      {item.name}
                    </Link>
                    <p className="tag mt-1 text-muted">
                      {[item.size && `Tam. ${item.size}`, item.color].filter(Boolean).join(" · ")}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center border border-ink/20">
                        <button
                          type="button"
                          className="grid h-9 w-9 place-items-center disabled:opacity-30"
                          onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Menos um"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          className="grid h-9 w-9 place-items-center disabled:opacity-30"
                          onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          aria-label="Mais um"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="font-semibold tabular-nums">{formatPrice(item.priceCents * item.quantity)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.variantId)}
                    className="grid h-9 w-9 shrink-0 place-items-center text-muted hover:text-ink"
                    aria-label={`Remover ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-ink/10 bg-paper p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="flex items-baseline justify-between">
                <span className="text-sm uppercase tracking-wide text-muted">Subtotal</span>
                <span className="display text-3xl">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">Envio calculado no checkout.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href="/carrinho" className="btn btn-outline">
                  Ver carrinho
                </Link>
                <Link href="/checkout" className="btn btn-primary">
                  Finalizar
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
