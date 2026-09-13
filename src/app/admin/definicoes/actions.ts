"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { optionalStr, parsePriceToCents, str } from "@/lib/format";
import { COUNTRY_CODES } from "@/lib/countries";
import { revalidateStore } from "@/lib/revalidate";
import { LEGAL_LINKS } from "@/lib/site";
import { StorageError, uploadImage } from "@/lib/storage";

function back(q: string): never {
  redirect(`/admin/definicoes?${q}`);
}

function safeUrl(value: FormDataEntryValue | null): string | null {
  const s = optionalStr(value);
  if (!s) return null;
  try {
    const url = new URL(s);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function maybeUpload(formData: FormData, field: string) {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return undefined;
  try {
    return await uploadImage(file, "loja");
  } catch (error) {
    back(`erro=${encodeURIComponent(error instanceof StorageError ? error.message : "Falha no upload")}`);
  }
}

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  const [logoUrl, heroImageUrl] = [await maybeUpload(formData, "logo"), await maybeUpload(formData, "heroImage")];

  const trustItems = [0, 1, 2, 3]
    .map((i) => ({ title: str(formData.get(`trustTitle${i}`)).slice(0, 60), text: str(formData.get(`trustText${i}`)).slice(0, 160) }))
    .filter((t) => t.title);

  const paymentMethods = ["MBWAY", "MULTIBANCO", "CARD"].filter((m) => formData.get(`pm_${m}`) === "on");

  const data = {
    storeName: str(formData.get("storeName")) || "CAETANO IMPORTZ",
    tagline: optionalStr(formData.get("tagline")),
    announcement: optionalStr(formData.get("announcement")),
    heroTitle: optionalStr(formData.get("heroTitle")),
    heroSubtitle: optionalStr(formData.get("heroSubtitle")),
    email: optionalStr(formData.get("email")),
    phone: optionalStr(formData.get("phone")),
    whatsappNumber: optionalStr(formData.get("whatsappNumber"))?.replace(/[^\d+]/g, "") || null,
    instagramUrl: safeUrl(formData.get("instagramUrl")),
    tiktokUrl: safeUrl(formData.get("tiktokUrl")),
    facebookUrl: safeUrl(formData.get("facebookUrl")),
    address: optionalStr(formData.get("address")),
    legalName: optionalStr(formData.get("legalName")),
    nif: optionalStr(formData.get("nif")),
    ralName: optionalStr(formData.get("ralName")),
    ralUrl: safeUrl(formData.get("ralUrl")),
    seoTitle: optionalStr(formData.get("seoTitle")),
    seoDescription: optionalStr(formData.get("seoDescription")),
    trustItems,
    paymentMethods: ["WHATSAPP", ...paymentMethods],
    ...(logoUrl ? { logoUrl } : formData.get("removeLogo") === "on" ? { logoUrl: null } : {}),
    ...(heroImageUrl ? { heroImageUrl } : formData.get("removeHero") === "on" ? { heroImageUrl: null } : {}),
  };

  await prisma.storeSettings.upsert({ where: { id: "store" }, update: data, create: { id: "store", ...data } });
  revalidateStore();
  back("ok=loja");
}

export async function saveShippingMethod(formData: FormData) {
  await requireAdmin();
  const id = optionalStr(formData.get("id"));
  const name = str(formData.get("name"));
  const priceCents = parsePriceToCents(formData.get("price"));
  const countries = str(formData.get("countries"))
    .toUpperCase()
    .split(/[\s,;]+/)
    .filter((c) => COUNTRY_CODES.includes(c));
  if (!name || priceCents == null || countries.length === 0) back("erro=envio#envios");

  const data = {
    name,
    priceCents,
    countries,
    freeOverCents: parsePriceToCents(formData.get("freeOver")),
    estimate: optionalStr(formData.get("estimate")),
    isActive: formData.get("isActive") === "on",
    sortOrder: Number(formData.get("sortOrder")) || 0,
  };
  if (id) await prisma.shippingMethod.update({ where: { id }, data });
  else await prisma.shippingMethod.create({ data });
  back("ok=envio#envios");
}

export async function deleteShippingMethod(formData: FormData) {
  await requireAdmin();
  await prisma.shippingMethod.delete({ where: { id: str(formData.get("id")) } });
  back("ok=envio#envios");
}

export async function saveLegalPage(formData: FormData) {
  await requireAdmin();
  const slug = str(formData.get("slug"));
  const link = LEGAL_LINKS.find((l) => l.slug === slug);
  if (!link) back("erro=legal");
  const title = str(formData.get("title")) || link.label;
  const content = str(formData.get("content")).slice(0, 60000);
  await prisma.legalPage.upsert({ where: { slug }, update: { title, content }, create: { slug, title, content } });
  revalidateStore();
  back("ok=legal#legal");
}
