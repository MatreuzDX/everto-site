"use client";

import { AlertTriangle, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/components/store/store-provider";
import { formatPrice } from "@/lib/format";
import type { PricedLine } from "@/lib/orders";

export function CartView() {
  const { cart, ready, setQuantity, removeFromCart, syncCart } = useStore();
  const [lines, setLines] = useState<Map<string, PricedLine> | null>(null);
  const key = cart.map((c) => c.variantId).join(",");

  // Confirma preços e stock no servidor sempre que o conjunto de artigos muda.
  useEffect(() => {
    if (!ready || cart.length === 0) return;
    let cancelled = false;
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.map((c) => ({ variantId: c.variantId, quantity: c.quantity })) }),
    })
      .then((r) => r.json())
      .then((data: { lines: PricedLine[] }) => {
        if (cancelled) return;
        setLines(new Map(data.lines.map((l) => [l.variantId, l])));
        syncCart(data.lines);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só quando mudam os artigos
  }, [ready, key]);

  const subtotal = cart.reduce((s, i) => s + i.priceCents * i.quantity, 0);
  const blocked = cart.some((c) => {
    const l = lines?.get(c.variantId);
    return l && (!l.available || c.quantity > l.stock);
  });

  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="skeleton h-20 w-72" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 md:px-6 md:pt-12">
      <h1 className="display text-6xl md:text-8xl">Carrinho</h1>

      {cart.length === 0 ? (
        <div className="mt-10 border-2 border-dashed border-ink/20 px-6 py-16 text-center">
          <p className="display text-4xl">Está vazio</p>
          <p className="mt-2 text-muted">Os artigos que adicionares aparecem aqui.</p>
          <Link href="/produtos" className="btn btn-primary mt-6">
            Ver produtos
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <ul className="divide-y divide-ink/10 border-y border-ink/10">
            {cart.map((item) => {
              const line = lines?.get(item.variantId);
              const problem = line
                ? !line.available
                  ? "Esgotado — remove para continuar."
                  : item.quantity > line.stock
                    ? `Só ${line.stock} disponíve${line.stock === 1 ? "l" : "is"}.`
                    : null
                : null;
              return (
                <li key={item.variantId} className="flex gap-4 py-5">
                  <Link href={`/produto/${item.slug}`} className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-paper-2 md:w-32">
                    {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="128px" className="object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <Link href={`/produto/${item.slug}`} className="font-semibold leading-snug">
                        {item.name}
                      </Link>
                      <p className="shrink-0 font-bold tabular-nums">{formatPrice(item.priceCents * item.quantity)}</p>
                    </div>
                    <p className="tag mt-1 text-muted">
                      {[item.size && `Tamanho ${item.size}`, item.color, `${formatPrice(item.priceCents)} / un.`].filter(Boolean).join(" · ")}
                    </p>
                    {problem && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-danger">
                        <AlertTriangle className="h-4 w-4" /> {problem}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-ink/20">
                        <button type="button" className="grid h-10 w-10 place-items-center disabled:opacity-30" onClick={() => setQuantity(item.variantId, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Menos um">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold tabular-nums">{item.quantity}</span>
                        <button type="button" className="grid h-10 w-10 place-items-center disabled:opacity-30" onClick={() => setQuantity(item.variantId, item.quantity + 1)} disabled={item.quantity >= item.maxStock} aria-label="Mais um">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.variantId)} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
                        <Trash2 className="h-4 w-4" /> Remover
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit bg-white p-6 lg:sticky lg:top-24">
            <p className="display text-3xl">Resumo</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Envio</dt>
                <dd>Calculado no checkout</dd>
              </div>
              <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
            </dl>
            <Link href="/checkout" aria-disabled={blocked} className={`btn btn-primary mt-6 h-14 w-full ${blocked ? "pointer-events-none opacity-40" : ""}`}>
              Finalizar compra
            </Link>
            {blocked && <p className="mt-2 text-center text-xs text-danger">Corrige os artigos assinalados.</p>}
            <Link href="/produtos" className="mt-3 block text-center text-sm underline">
              Continuar a comprar
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
