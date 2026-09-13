import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { Stars } from "./stars";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const onSale = product.salePriceCents != null && product.salePriceCents < product.priceCents;
  const soldOut = product.totalStock === 0;

  return (
    <article className="group relative">
      <Link href={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-paper-2">
          {product.image ? (
            <>
              <Image
                src={product.image.url}
                alt={product.image.alt || product.name}
                fill
                priority={priority}
                sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
                className={`object-cover transition duration-500 group-hover:scale-[1.03] ${product.hoverImage ? "group-hover:opacity-0" : ""} ${soldOut ? "opacity-60 grayscale" : ""}`}
              />
              {product.hoverImage && (
                <Image
                  src={product.hoverImage}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
                  className="object-cover opacity-0 transition duration-500 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="grid h-full place-items-center">
              <span className="display text-5xl text-ink/10">CI</span>
            </div>
          )}

          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {soldOut ? (
              <span className="tag bg-ink px-2 py-1 text-paper">Esgotado</span>
            ) : (
              <>
                {product.isNew && <span className="tag bg-lime px-2 py-1 text-ink">Novo</span>}
                {product.isLimited && <span className="tag bg-ink px-2 py-1 text-paper">Limitado</span>}
                {onSale && (
                  <span className="tag bg-danger px-2 py-1 text-white">
                    −{Math.round((1 - product.salePriceCents! / product.priceCents) * 100)}%
                  </span>
                )}
              </>
            )}
          </div>

          {!soldOut && product.sizes.length > 0 && (
            <div className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-paper/95 px-3 py-2 transition group-hover:translate-y-0 md:block">
              <p className="tag truncate text-muted">{product.sizes.join(" · ")}</p>
            </div>
          )}
        </div>

        <div className="mt-3 pr-9">
          {product.brand && <p className="tag text-muted">{product.brand}</p>}
          <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`font-bold tabular-nums ${onSale ? "text-danger" : ""}`}>
              {formatPrice(onSale ? product.salePriceCents! : product.priceCents)}
            </span>
            {onSale && <s className="text-xs text-muted tabular-nums">{formatPrice(product.priceCents)}</s>}
          </div>
          {product.rating && <Stars value={product.rating.average} count={product.rating.count} className="mt-1" />}
          <p className={`tag mt-1 ${soldOut ? "text-muted" : product.lowStock ? "text-danger" : "text-emerald-700"}`}>
            {soldOut ? "Esgotado" : product.lowStock ? "Últimas unidades" : "Disponível"}
          </p>
        </div>
      </Link>

      <WishlistButton productId={product.id} name={product.name} className="absolute bottom-[4.5rem] right-0 md:bottom-auto md:right-2 md:top-2 md:bg-paper/80" />
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function ProductRail({ products }: { products: ProductCardData[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0">
      {products.map((p) => (
        <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] md:w-auto">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
