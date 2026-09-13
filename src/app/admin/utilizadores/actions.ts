"use server";

import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, MIN_PASSWORD_LENGTH, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { str } from "@/lib/format";

function back(q: string): never {
  redirect(`/admin/utilizadores?${q}`);
}

export async function createStaff(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(120),
      email: z.email().max(160),
      password: z.string().min(MIN_PASSWORD_LENGTH).max(200),
      role: z.enum(["STAFF", "ADMIN"]),
    })
    .safeParse({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password"), role: formData.get("role") });
  if (!parsed.success) back("erro=dados");

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Conta de cliente já existente passa a ser da equipa (mantém a palavra-passe dela).
    await prisma.user.update({ where: { id: existing.id }, data: { role: parsed.data.role, isActive: true } });
    back("ok=promovido");
  }
  await prisma.user.create({
    data: { name: parsed.data.name, email, role: parsed.data.role, passwordHash: await hashPassword(parsed.data.password) },
  });
  back("ok=criado");
}

export async function updateStaff(formData: FormData) {
  const me = await requireAdmin();
  const id = str(formData.get("id"));
  const role = str(formData.get("role")) as Role;
  const isActive = formData.get("isActive") === "on";
  if (!["CUSTOMER", "STAFF", "ADMIN"].includes(role)) back("erro=dados");
  if (id === me.id && (role !== "ADMIN" || !isActive)) back("erro=proprio");

  const target = await prisma.user.findUniqueOrThrow({ where: { id } });
  if (target.role === "ADMIN" && (role !== "ADMIN" || !isActive)) {
    const admins = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
    if (admins <= 1) back("erro=ultimo");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { role, isActive } }),
    ...(isActive ? [] : [prisma.session.deleteMany({ where: { userId: id } })]),
  ]);
  back("ok=atualizado");
}
