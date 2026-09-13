"use client";

import { Heart } from "lucide-react";
import { useStore } from "@/components/store/store-provider";
import { cn } from "@/lib/format";

export function WishlistButton({ productId, name, className }: { productId: string; name: string; className?: string }) {
  const { wishlist, toggleWishlist, ready } = useStore();
  const active = ready && wishlist.includes(productId);

  return (
    <button
      type="button"
      onClick={() => toggleWishlist(productId, name)}
      aria-pressed={active}
      aria-label={active ? `Remover ${name} dos favoritos` : `Adicionar ${name} aos favoritos`}
      className={cn("grid h-9 w-9 place-items-center rounded-full transition active:scale-90", className)}
    >
      <Heart className={cn("h-[18px] w-[18px] transition", active ? "scale-110 fill-danger text-danger" : "text-ink")} />
    </button>
  );
}
