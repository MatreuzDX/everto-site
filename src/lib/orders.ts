/**
 * Carrinho, encomendas e stock.
 *
 * Regras:
 *  - O preço vem SEMPRE do banco, nunca do browser.
 *  - No checkout valida-se o stock; não se deixa encomendar acima do que há.
 *  - O stock desconta-se quando a compra é CONFIRMADA (estado Pago ou
 *    seguinte), numa transação com `stock >= quantidade` — se entretanto
 *    esgotou, a confirmação falha em vez de deixar stock negativo.
 *  - Cancelar/reembolsar uma encomenda com stock descontado devolve-o.
 */

import { randomBytes } from "node:crypto";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { STOCK_COMMITTED_STATUSES, STOCK_RELEASED_STATUSES } from "./order-status";

export class OrderError extends Error {}

export type CartInput = { variantId: string; quantity: number }[];

export type PricedLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  stock: number;
  available: boolean;
};

export async function priceCart(input: CartInput): Promise<PricedLine[]> {
  const ids = [...new Set(input.map((i) => i.variantId))].slice(0, 50);
  if (ids.length === 0) return [];

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: ids } },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          priceCents: true,
          salePriceCents: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  return input.flatMap((item) => {
    const v = byId.get(item.variantId);
    if (!v) return [];
    const quantity = Math.max(1, Math.min(99, Math.floor(item.quantity)));
    return [
      {
        variantId: v.id,
        productId: v.product.id,
        slug: v.product.slug,
        name: v.product.name,
        size: v.size,
        color: v.color,
        sku: v.sku,
        imageUrl: v.product.images[0]?.url ?? null,
        unitPriceCents: v.product.salePriceCents ?? v.product.priceCents,
        quantity,
        stock: Math.max(v.stock, 0),
        available: v.isActive && v.product.status === "ACTIVE" && v.stock > 0,
      },
    ];
  });
}

export async function shippingOptionsFor(country: string, subtotalCents: number) {
  const methods = await prisma.shippingMethod.findMany({
    where: { isActive: true, countries: { has: country } },
    orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
  });
  return methods.map((m) => ({
    id: m.id,
    name: m.name,
    estimate: m.estimate,
    priceCents: m.freeOverCents != null && subtotalCents >= m.freeOverCents ? 0 : m.priceCents,
    freeOverCents: m.freeOverCents,
  }));
}

export async function createOrder(input: {
  items: CartInput;
  userId: string | null;
  customer: {
    name: string;
    email: string;
    phone: string;
    line1: string;
    line2: string | null;
    postalCode: string;
    city: string;
    country: string;
  };
  paymentMethod: string;
  shippingMethodId: string | null;
  note: string | null;
}) {
  const lines = await priceCart(input.items);
  if (lines.length === 0) throw new OrderError("O carrinho está vazio.");

  for (const line of lines) {
    if (!line.available) throw new OrderError(`${line.name} já não está disponível.`);
    if (line.quantity > line.stock) {
      throw new OrderError(
        `Só ${line.stock === 1 ? "resta 1 unidade" : `restam ${line.stock} unidades`} de ${line.name}${line.size ? ` (${line.size})` : ""}.`,
      );
    }
  }

  const subtotalCents = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);

  const options = await shippingOptionsFor(input.customer.country, subtotalCents);
  let shippingCents = 0;
  let shippingLabel: string | null = options.length === 0 ? "Envio a combinar" : null;
  if (options.length > 0) {
    const chosen = options.find((o) => o.id === input.shippingMethodId);
    if (!chosen) throw new OrderError("Escolhe um método de envio.");
    shippingCents = chosen.priceCents;
    shippingLabel = chosen.name;
  }

  const totalCents = subtotalCents + shippingCents;

  return prisma.order.create({
    data: {
      accessToken: randomBytes(24).toString("base64url"),
      userId: input.userId,
      status: "PENDING_PAYMENT",
      ...input.customer,
      subtotalCents,
      shippingCents,
      totalCents,
      paymentMethod: input.paymentMethod,
      shippingMethodId: options.length > 0 ? input.shippingMethodId : null,
      shippingLabel,
      customerNote: input.note,
      items: {
        create: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          name: l.name,
          size: l.size,
          color: l.color,
          sku: l.sku,
          imageUrl: l.imageUrl,
          unitPriceCents: l.unitPriceCents,
          quantity: l.quantity,
        })),
      },
      payments: {
        create: {
          provider: input.paymentMethod === "WHATSAPP" ? "manual" : "ifthenpay",
          method: input.paymentMethod,
          amountCents: totalCents,
        },
      },
      history: { create: { status: "PENDING_PAYMENT", note: "Encomenda criada no site" } },
    },
    select: { id: true, seq: true, accessToken: true, totalCents: true },
  });
}

async function commitStock(tx: Prisma.TransactionClient, orderId: string, userId: string | null) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    if (!item.variantId) continue;
    const updated = await tx.productVariant.updateMany({
      where: { id: item.variantId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (updated.count === 0) {
      throw new OrderError(
        `Stock insuficiente para ${item.name}${item.size ? ` (${item.size})` : ""}. Ajusta o stock ou a encomenda antes de confirmar.`,
      );
    }
    await tx.inventoryMovement.create({
      data: { variantId: item.variantId, change: -item.quantity, reason: "SALE", orderId, userId },
    });
    if (item.productId) {
      await tx.product.update({
        where: { id: item.productId },
        data: { soldCount: { increment: item.quantity } },
      });
    }
  }
}

async function releaseStock(tx: Prisma.TransactionClient, orderId: string, userId: string | null) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    if (!item.variantId) continue;
    const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
    if (!variant) continue;
    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
    });
    await tx.inventoryMovement.create({
      data: {
        variantId: item.variantId,
        change: item.quantity,
        reason: "ORDER_CANCELLED",
        orderId,
        userId,
      },
    });
    if (item.productId) {
      await tx.product.updateMany({
        where: { id: item.productId, soldCount: { gte: item.quantity } },
        data: { soldCount: { decrement: item.quantity } },
      });
    }
  }
}

export async function changeOrderStatus(input: {
  orderId: string;
  status: OrderStatus;
  userId: string | null;
  note?: string | null;
  trackingCode?: string | null;
}) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new OrderError("Encomenda não encontrada.");

    let stockCommittedAt = order.stockCommittedAt;
    if (STOCK_COMMITTED_STATUSES.includes(input.status) && !stockCommittedAt) {
      await commitStock(tx, order.id, input.userId);
      stockCommittedAt = new Date();
    } else if (STOCK_RELEASED_STATUSES.includes(input.status) && stockCommittedAt) {
      await releaseStock(tx, order.id, input.userId);
      stockCommittedAt = null;
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
        stockCommittedAt,
        ...(input.trackingCode !== undefined ? { trackingCode: input.trackingCode } : {}),
      },
    });

    if (input.status === "PAID") {
      await tx.payment.updateMany({
        where: { orderId: order.id, status: "PENDING" },
        data: { status: "PAID" },
      });
    } else if (input.status === "CANCELLED") {
      await tx.payment.updateMany({
        where: { orderId: order.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
    } else if (input.status === "REFUNDED") {
      await tx.payment.updateMany({
        where: { orderId: order.id, status: "PAID" },
        data: { status: "REFUNDED" },
      });
    }

    if (order.status !== input.status || input.note) {
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: input.status,
          note: input.note || null,
          userId: input.userId,
        },
      });
    }
  });
}
