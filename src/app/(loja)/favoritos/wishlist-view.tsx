"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/product/product-card";
import { useStore } from "@/components/store/store-provider";
import type { ProductCardData } from "@/lib/catalog";

export function WishlistView() {
  const { wishlist, ready } = useStore();
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const ids = wishlist.join(",");

  useEffect(() => {
    if (!ready) return;
    if (!ids) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lista vazia não precisa de pedido
      setProducts([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/products?ids=${encodeURIComponent(ids)}`)
      .then((r) => r.json())
      .then((data: { products: ProductCardData[] }) => {
        if (cancelled) return;
        const order = new Map(ids.split(",").map((id, i) => [id, i]));
        setProducts(data.products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)));
      })
      .catch(() => setProducts([]));
    return () => {
      cancelled = true;
    };
  }, [ids, ready]);

  if (products === null) {
    return (
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[4/5]" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mt-10 border-2 border-dashed border-ink/20 px-6 py-16 text-center">
        <p className="display text-4xl">Ainda sem favoritos</p>
        <p className="mt-2 text-muted">Toca no coração de um produto para o guardar aqui.</p>
        <Link href="/produtos" className="btn btn-primary mt-6">
          Explorar
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <ProductGrid products={products} />
    </div>
  );
}
