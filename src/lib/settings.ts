import type { StoreSettings } from "@prisma/client";
import { cache } from "react";
import { prisma, safe } from "./db";

export type TrustItem = { title: string; text: string };

const DEFAULTS: StoreSettings = {
  id: "store",
  storeName: "CAETANO IMPORTZ",
  tagline: null,
  logoUrl: null,
  announcement: null,
  heroTitle: "Estilo importado. Identidade única.",
  heroSubtitle: null,
  heroImageUrl: null,
  email: null,
  phone: null,
  whatsappNumber: null,
  instagramUrl: "https://www.instagram.com/caetano_importz/",
  tiktokUrl: null,
  facebookUrl: null,
  address: null,
  legalName: null,
  nif: null,
  ralName: null,
  ralUrl: null,
  seoTitle: null,
  seoDescription: null,
  trustItems: [],
  paymentMethods: ["WHATSAPP"],
  updatedAt: new Date(0),
};

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const row = await safe(() => prisma.storeSettings.findUnique({ where: { id: "store" } }), null);
  return row ?? DEFAULTS;
});

export function trustItemsOf(settings: StoreSettings): TrustItem[] {
  if (!Array.isArray(settings.trustItems)) return [];
  return (settings.trustItems as unknown[])
    .filter((i): i is TrustItem => {
      const item = i as TrustItem;
      return typeof item?.title === "string" && item.title.trim() !== "";
    })
    .slice(0, 6);
}

export function instagramHandle(url: string | null): string | null {
  if (!url) return null;
  const match = /instagram\.com\/([^/?#]+)/i.exec(url);
  return match ? match[1] : null;
}
