import type { OrderStatus } from "@prisma/client";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  PENDING: { label: "Pendente", tone: "bg-neutral-200 text-neutral-800" },
  PENDING_PAYMENT: { label: "Pagamento pendente", tone: "bg-amber-100 text-amber-900" },
  PAID: { label: "Pago", tone: "bg-emerald-100 text-emerald-900" },
  PREPARING: { label: "Em preparação", tone: "bg-sky-100 text-sky-900" },
  SHIPPED: { label: "Enviado", tone: "bg-indigo-100 text-indigo-900" },
  DELIVERED: { label: "Entregue", tone: "bg-emerald-200 text-emerald-950" },
  CANCELLED: { label: "Cancelado", tone: "bg-red-100 text-red-900" },
  REFUNDED: { label: "Reembolsado", tone: "bg-fuchsia-100 text-fuchsia-900" },
};

export const ORDER_STATUS_LIST = Object.keys(ORDER_STATUS) as OrderStatus[];

/** Estados em que o stock já tem de estar descontado. */
export const STOCK_COMMITTED_STATUSES: OrderStatus[] = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"];
/** Estados que devolvem stock (se tinha sido descontado). */
export const STOCK_RELEASED_STATUSES: OrderStatus[] = ["CANCELLED", "REFUNDED"];
/** Estados que contam como receita. */
export const REVENUE_STATUSES: OrderStatus[] = STOCK_COMMITTED_STATUSES;
