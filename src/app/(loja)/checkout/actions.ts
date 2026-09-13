"use server";

import { z } from "zod";
import { getCurrentUser, getRequestIp } from "@/lib/auth";
import { COUNTRY_CODES } from "@/lib/countries";
import { prisma } from "@/lib/db";
import { orderNumber } from "@/lib/format";
import { createOrder, OrderError } from "@/lib/orders";
import { checkoutMethods } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";

export type CheckoutState = { ok: false; error: string; fields?: Record<string, string> } | { ok: true; url: string } | null;

const schema = z
  .object({
    name: z.string().trim().min(2, "Indica o nome completo.").max(120),
    email: z.email("E-mail inválido.").max(160),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s()-]{9,20}$/, "Telefone inválido."),
    line1: z.string().trim().min(4, "Indica a morada.").max(200),
    line2: z.string().trim().max(200).optional(),
    postalCode: z.string().trim().min(3, "Código postal inválido.").max(12),
    city: z.string().trim().min(2, "Indica a cidade.").max(80),
    country: z.string().refine((c) => COUNTRY_CODES.includes(c), "País não suportado."),
    paymentMethod: z.string(),
    shippingMethodId: z.string().max(40).optional(),
    note: z.string().trim().max(500).optional(),
    saveAddress: z.string().optional(),
    acceptTerms: z.literal("on", { error: "Tens de aceitar os termos e condições." }),
    items: z
      .array(z.object({ variantId: z.string().min(1).max(40), quantity: z.number().int().min(1).max(99) }))
      .min(1, "O carrinho está vazio.")
      .max(50),
  })
  .refine((d) => d.country !== "PT" || /^\d{4}-\d{3}$/.test(d.postalCode), {
    path: ["postalCode"],
    message: "Em Portugal o código postal é 0000-000.",
  });

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const ip = await getRequestIp();
  if (!rateLimit(`checkout:${ip}`, 10, 10 * 60_000)) {
    return { ok: false, error: "Demasiadas tentativas. Espera uns minutos e tenta de novo." };
  }

  let items: unknown = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {}

  const raw = Object.fromEntries(
    [...formData.entries()].filter(([k]) => k !== "items").map(([k, v]) => [k, typeof v === "string" ? v : ""]),
  );
  const parsed = schema.safeParse({ ...raw, items, line2: raw.line2 || undefined, note: raw.note || undefined });
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "Revê os campos assinalados.", fields };
  }
  const data = parsed.data;

  const settings = await getSettings();
  const method = checkoutMethods(settings.paymentMethods).find((m) => m.id === data.paymentMethod);
  if (!method?.available) return { ok: false, error: "Esse método de pagamento ainda não está disponível." };

  const user = await getCurrentUser();

  try {
    const order = await createOrder({
      items: data.items,
      userId: user?.id ?? null,
      customer: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 ?? null,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
      },
      paymentMethod: method.id,
      shippingMethodId: data.shippingMethodId ?? null,
      note: data.note ?? null,
    });

    if (user && data.saveAddress === "on") {
      const hasAddress = await prisma.address.count({ where: { userId: user.id } });
      await prisma.address.create({
        data: {
          userId: user.id,
          name: data.name,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2 ?? null,
          postalCode: data.postalCode,
          city: data.city,
          country: data.country,
          isDefault: hasAddress === 0,
        },
      });
    }

    return { ok: true, url: `/encomenda/${orderNumber(order.seq)}?t=${order.accessToken}` };
  } catch (error) {
    if (error instanceof OrderError) return { ok: false, error: error.message };
    console.error("[checkout]", error);
    return { ok: false, error: "Não foi possível registar a encomenda. Tenta novamente." };
  }
}
