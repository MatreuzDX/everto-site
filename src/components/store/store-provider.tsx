"use client";

/**
 * Estado do browser: carrinho, favoritos e avisos (toasts).
 *
 * O carrinho guarda só variante + quantidade + um "retrato" para mostrar
 * logo (nome, tamanho, preço, foto). Preços e stock reais são sempre
 * confirmados no servidor (/api/cart e checkout).
 *
 * Favoritos: localStorage para todos; com sessão iniciada sincronizam com o
 * banco (/api/wishlist) — os locais juntam-se aos da conta no primeiro load.
 */

import { Check, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  variantId: string;
  quantity: number;
  productId: string;
  slug: string;
  name: string;
  size: string | null;
  color: string | null;
  priceCents: number;
  imageUrl: string | null;
  maxStock: number;
};

type Toast = { id: number; message: string; tone: "ok" | "error" };

type StoreContextValue = {
  ready: boolean;
  cart: CartItem[];
  cartCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: CartItem) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  /** Atualiza preço, stock e dados a partir do servidor; remove o que já não existe. */
  syncCart: (lines: { variantId: string; unitPriceCents: number; stock: number; name: string; imageUrl: string | null }[]) => void;
  wishlist: string[];
  toggleWishlist: (productId: string, name?: string) => void;
  toast: (message: string, tone?: "ok" | "error") => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_KEY = "ci_cart_v1";
const WISH_KEY = "ci_wishlist_v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* modo privado / quota — segue sem persistir */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const loggedIn = useRef(false);
  const toastId = useRef(0);

  const toast = useCallback((message: string, tone: "ok" | "error" = "ok") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  // Carregar do localStorage e sincronizar favoritos com a conta, se existir.
  useEffect(() => {
    const localCart = read<CartItem[]>(CART_KEY, []);
    const localWish = read<string[]>(WISH_KEY, []);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratação única a partir do localStorage
    setCart(Array.isArray(localCart) ? localCart : []);
    setWishlist(Array.isArray(localWish) ? localWish : []);
    setReady(true);

    fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merge: localWish }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { loggedIn: boolean; ids: string[] } | null) => {
        if (data?.loggedIn) {
          loggedIn.current = true;
          setWishlist(data.ids);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (ready) write(CART_KEY, cart);
  }, [cart, ready]);

  useEffect(() => {
    if (ready) write(WISH_KEY, wishlist);
  }, [wishlist, ready]);

  const addToCart = useCallback(
    (item: CartItem) => {
      let capped = false;
      setCart((current) => {
        const existing = current.find((c) => c.variantId === item.variantId);
        if (existing) {
          const quantity = Math.min(existing.quantity + item.quantity, item.maxStock);
          capped = quantity < existing.quantity + item.quantity;
          return current.map((c) =>
            c.variantId === item.variantId ? { ...item, quantity } : c,
          );
        }
        const quantity = Math.min(item.quantity, item.maxStock);
        capped = quantity < item.quantity;
        return [...current, { ...item, quantity }];
      });
      setCartOpen(true);
      setTimeout(() => {
        toast(capped ? "Quantidade limitada ao stock disponível" : "Adicionado ao carrinho");
      }, 0);
    },
    [toast],
  );

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setCart((current) =>
      current.map((c) =>
        c.variantId === variantId
          ? { ...c, quantity: Math.max(1, Math.min(quantity, c.maxStock || 99)) }
          : c,
      ),
    );
  }, []);

  const removeFromCart = useCallback((variantId: string) => {
    setCart((current) => current.filter((c) => c.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const syncCart = useCallback<StoreContextValue["syncCart"]>((lines) => {
    const byId = new Map(lines.map((l) => [l.variantId, l]));
    setCart((current) =>
      current
        .filter((c) => byId.has(c.variantId))
        .map((c) => {
          const line = byId.get(c.variantId)!;
          return {
            ...c,
            name: line.name,
            imageUrl: line.imageUrl,
            priceCents: line.unitPriceCents,
            maxStock: line.stock,
            quantity: line.stock > 0 ? Math.min(c.quantity, line.stock) : c.quantity,
          };
        }),
    );
  }, []);

  const toggleWishlist = useCallback(
    (productId: string, name?: string) => {
      setWishlist((current) => {
        const has = current.includes(productId);
        const next = has ? current.filter((id) => id !== productId) : [productId, ...current].slice(0, 100);
        if (loggedIn.current) {
          fetch("/api/wishlist", {
            method: has ? "DELETE" : "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          }).catch(() => {});
        }
        setTimeout(() => toast(has ? "Removido dos favoritos" : `${name ?? "Produto"} nos favoritos`), 0);
        return next;
      });
    },
    [toast],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      ready,
      cart,
      cartCount: cart.reduce((sum, c) => sum + c.quantity, 0),
      cartOpen,
      setCartOpen,
      addToCart,
      setQuantity,
      removeFromCart,
      clearCart,
      syncCart,
      wishlist,
      toggleWishlist,
      toast,
    }),
    [ready, cart, cartOpen, addToCart, setQuantity, removeFromCart, clearCart, syncCart, wishlist, toggleWishlist, toast],
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-fade-up flex items-center gap-2 bg-ink px-4 py-3 text-sm font-medium text-paper shadow-xl"
          >
            {t.tone === "ok" ? (
              <Check className="h-4 w-4 text-brand" aria-hidden />
            ) : (
              <X className="h-4 w-4 text-danger" aria-hidden />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore fora do StoreProvider");
  return ctx;
}
