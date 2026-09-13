"use server";

import type { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { optionalStr, str } from "@/lib/format";
import { ORDER_STATUS_LIST } from "@/lib/order-status";
import { changeOrderStatus, OrderError } from "@/lib/orders";
import { revalidateStore } from "@/lib/revalidate";

export type OrderFormState = { ok: boolean; message: string } | null;

export async function updateOrderStatus(_prev: OrderFormState, formData: FormData): Promise<OrderFormState> {
  const user = await requireStaff();
  const orderId = str(formData.get("orderId"));
  const status = str(formData.get("status")) as OrderStatus;
  if (!ORDER_STATUS_LIST.includes(status)) return { ok: false, message: "Estado inválido." };

  try {
    await changeOrderStatus({
      orderId,
      status,
      userId: user.id,
      note: optionalStr(formData.get("note")),
      trackingCode: optionalStr(formData.get("trackingCode")),
    });
  } catch (error) {
    if (error instanceof OrderError) return { ok: false, message: error.message };
    console.error("[updateOrderStatus]", error);
    return { ok: false, message: "Não foi possível atualizar a encomenda." };
  }

  revalidatePath(`/admin/encomendas/${orderId}`);
  revalidateStore(); // stock e "mais vendidos" podem ter mudado
  return { ok: true, message: "Encomenda atualizada." };
}

export async function saveInternalNote(formData: FormData) {
  await requireStaff();
  const orderId = str(formData.get("orderId"));
  await prisma.order.update({ where: { id: orderId }, data: { internalNote: optionalStr(formData.get("internalNote")) } });
  revalidatePath(`/admin/encomendas/${orderId}`);
}
