"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword, MIN_PASSWORD_LENGTH, requireUser, verifyPassword } from "@/lib/auth";
import { COUNTRY_CODES } from "@/lib/countries";
import { prisma } from "@/lib/db";

export type FormState = { ok: boolean; message: string } | null;

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = z
    .object({ name: z.string().trim().min(2).max(120), phone: z.string().trim().max(20) })
    .safeParse({ name: formData.get("name"), phone: formData.get("phone") ?? "" });
  if (!parsed.success) return { ok: false, message: "Verifica o nome e o telefone." };
  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  });
  revalidatePath("/account", "layout");
  return { ok: true, message: "Dados guardados." };
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `A nova palavra-passe precisa de ${MIN_PASSWORD_LENGTH} caracteres.` };
  }
  const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  // Contas criadas com Google podem definir a primeira palavra-passe sem a "atual".
  if (row.passwordHash && !(await verifyPassword(row.passwordHash, current))) {
    return { ok: false, message: "A palavra-passe atual não está certa." };
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } }),
    // Termina as outras sessões; a atual continua.
    prisma.session.deleteMany({ where: { userId: user.id, createdAt: { lt: new Date(Date.now() - 1000) } } }),
  ]);
  return { ok: true, message: "Palavra-passe alterada. As outras sessões foram terminadas." };
}

const addressSchema = z.object({
  label: z.string().trim().max(40).optional(),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(20).optional(),
  line1: z.string().trim().min(4).max(200),
  line2: z.string().trim().max(200).optional(),
  postalCode: z.string().trim().min(3).max(12),
  city: z.string().trim().min(2).max(80),
  country: z.string().refine((c) => COUNTRY_CODES.includes(c)),
});

export async function addAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const raw = Object.fromEntries([...formData.entries()].map(([k, v]) => [k, typeof v === "string" && v !== "" ? v : undefined]));
  const parsed = addressSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Preenche nome, morada, código postal e cidade." };
  const count = await prisma.address.count({ where: { userId: user.id } });
  if (count >= 10) return { ok: false, message: "Máximo de 10 moradas." };
  await prisma.address.create({ data: { ...parsed.data, userId: user.id, isDefault: count === 0 } });
  revalidatePath("/account/moradas");
  return { ok: true, message: "Morada adicionada." };
}

export async function deleteAddress(formData: FormData) {
  const user = await requireUser();
  await prisma.address.deleteMany({ where: { id: String(formData.get("id")), userId: user.id } });
  revalidatePath("/account/moradas");
}

export async function setDefaultAddress(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    prisma.address.updateMany({ where: { id, userId: user.id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account/moradas");
}
