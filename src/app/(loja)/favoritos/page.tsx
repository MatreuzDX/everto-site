import type { Metadata } from "next";
import { WishlistView } from "./wishlist-view";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 md:px-6 md:pt-12">
      <p className="tag text-muted">Guardados</p>
      <h1 className="display mt-2 text-6xl md:text-8xl">Favoritos</h1>
      <WishlistView />
    </div>
  );
}
