"use server";

import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { str } from "@/lib/format";
import { revalidateStore } from "@/lib/revalidate";

export async function adjustStock(formData: FormData) {
  const user = await requireStaff();
  const variantId = str(formData.get("variantId"));
  const stock = Number(formData.get("stock"));
  const reason = str(formData.get("reason")) === "RESTOCK" ? "RESTOCK" : "ADJUSTMENT";
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) redirect("/admin/stock?erro=1");

  await prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    if (variant.stock === stock) return;
    await tx.productVariant.update({ where: { id: variantId }, data: { stock } });
    await tx.inventoryMovement.create({
      data: { variantId, change: stock - variant.stock, reason, userId: user.id, note: "Página de stock" },
    });
  });

  revalidateStore();
  redirect("/admin/stock?ok=1");
}
