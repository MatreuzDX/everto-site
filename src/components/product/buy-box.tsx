"use client";

import { ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { WhatsAppIcon } from "@/components/layout/whatsapp-float";
import { useStore } from "@/components/store/store-provider";
import { compareSizes } from "@/lib/catalog-shared";
import { formatPrice } from "@/lib/format";
import { productMessage, whatsappLink } from "@/lib/whatsapp";
import { WishlistButton } from "./wishlist-button";

type Variant = { id: string; size: string | null; color: string | null; stock: number };

export function BuyBox({
  product,
  variants,
  whatsappNumber,
  productUrl,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    priceCents: number;
    salePriceCents: number | null;
    imageUrl: string | null;
    lowStockThreshold: number;
  };
  variants: Variant[];
  whatsappNumber: string | null;
  productUrl: string;
}) {
  const { addToCart } = useStore();
  const colors = useMemo(() => [...new Set(variants.map((v) => v.color).filter(Boolean) as string[])], [variants]);
  const [color, setColor] = useState<string | null>(colors.length === 1 ? colors[0] : null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const mainButton = useRef<HTMLDivElement>(null);

  const forColor = variants
    .filter((v) => colors.length === 0 || v.color === color)
    .sort((a, b) => compareSizes(a.size ?? "", b.size ?? ""));
  const hasSizes = forColor.some((v) => v.size);

  // Produto sem tamanhos (ex.: acessório com uma só variante) — escolhe sozinho.
  const autoVariant = !hasSizes && forColor.length === 1 ? forColor[0] : null;
  const selected = variants.find((v) => v.id === variantId) ?? autoVariant;
  const totalStock = variants.reduce((s, v) => s + Math.max(0, v.stock), 0);
  const price = product.salePriceCents ?? product.priceCents;
  const onSale = product.salePriceCents != null && product.salePriceCents < product.priceCents;

  useEffect(() => {
    const el = mainButton.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function add() {
    if (colors.length > 1 && !color) return setError("Escolhe uma cor.");
    if (!selected) return setError("Escolhe um tamanho.");
    if (selected.stock <= 0) return setError("Esse tamanho está esgotado.");
    setError(null);
    addToCart({
      variantId: selected.id,
      quantity: 1,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      size: selected.size,
      color: selected.color,
      priceCents: price,
      imageUrl: product.imageUrl,
      maxStock: selected.stock,
    });
  }

  const wa = whatsappLink(
    whatsappNumber,
    productMessage({ name: product.name, size: selected?.size, color: selected?.color, priceCents: price, url: productUrl }),
  );

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <p className={`display text-5xl ${onSale ? "text-danger" : ""}`}>{formatPrice(price)}</p>
        {onSale && <s className="text-lg text-muted">{formatPrice(product.priceCents)}</s>}
      </div>

      {colors.length > 1 && (
        <fieldset className="mt-6">
          <legend className="label">
            Cor{color && <span className="ml-2 font-normal normal-case text-muted">{color}</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const inStock = variants.some((v) => v.color === c && v.stock > 0);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setColor(c);
                    setVariantId(null);
                  }}
                  aria-pressed={color === c}
                  className={`h-11 border px-4 text-sm font-semibold ${color === c ? "border-ink bg-ink text-paper" : "border-ink/20"} ${inStock ? "" : "text-muted line-through"}`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {hasSizes && (
        <fieldset className="mt-6">
          <legend className="label flex w-full justify-between">
            <span>Tamanho</span>
            {selected && selected.stock > 0 && selected.stock <= product.lowStockThreshold && (
              <span className="normal-case text-danger">
                {selected.stock === 1 ? "Última unidade!" : `Só restam ${selected.stock}`}
              </span>
            )}
          </legend>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {forColor.map((v) => {
              const soldOut = v.stock <= 0;
              const low = !soldOut && v.stock <= product.lowStockThreshold;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => {
                    setVariantId(v.id);
                    setError(null);
                  }}
                  aria-pressed={variantId === v.id}
                  aria-label={`Tamanho ${v.size}${soldOut ? ", esgotado" : low ? `, só ${v.stock}` : ""}`}
                  className={`relative h-12 border text-sm font-bold transition ${
                    variantId === v.id ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"
                  } ${soldOut ? "cursor-not-allowed bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(0,0,0,.06)_6px,rgba(0,0,0,.06)_7px)] text-muted" : ""}`}
                >
                  {v.size}
                  {low && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-danger" aria-hidden />}
                </button>
              );
            })}
          </div>
          <p className="tag mt-2 text-muted">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-danger align-middle" /> poucas unidades
          </p>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      <div ref={mainButton} className="mt-6 flex gap-2">
        <button type="button" onClick={add} disabled={totalStock === 0} className="btn btn-primary h-14 flex-1">
          <ShoppingBag className="h-5 w-5" />
          {totalStock === 0 ? "Esgotado" : "Adicionar ao carrinho"}
        </button>
        <WishlistButton productId={product.id} name={product.name} className="h-14 w-14 rounded-none border border-ink/20" />
      </div>

      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-2 h-14 w-full">
          <WhatsAppIcon className="h-5 w-5" /> Comprar pelo WhatsApp
        </a>
      )}

      {/* Barra fixa no telemóvel quando o botão principal sai do ecrã */}
      {showSticky && totalStock > 0 && (
        <div className="animate-fade-up fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-ink/10 bg-paper/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <p className="text-sm tabular-nums">
              {formatPrice(price)}
              {selected?.size ? ` · ${selected.size}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => (selected ? add() : mainButton.current?.scrollIntoView({ behavior: "smooth", block: "center" }))}
            className="btn btn-primary h-12 px-5"
          >
            {selected ? "Adicionar" : "Escolher tamanho"}
          </button>
        </div>
      )}
    </div>
  );
}
