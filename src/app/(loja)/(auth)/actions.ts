"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthError, getRequestIp, isStaff, loginUser, logoutUser, MIN_PASSWORD_LENGTH, registerUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export type AuthState = { error: string } | null;

/** Só caminhos internos — impede redirecionamentos abertos (?next=https://…). */
function safeNext(value: FormDataEntryValue | null): string | null {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : null;
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const ip = await getRequestIp();
  if (!rateLimit(`login:${ip}`, 10, 10 * 60_000)) {
    return { error: "Demasiadas tentativas. Espera uns minutos." };
  }
  const parsed = z
    .object({ email: z.email(), password: z.string().min(1).max(200) })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "E-mail ou palavra-passe incorretos." };

  let destination: string;
  try {
    const user = await loginUser(parsed.data.email, parsed.data.password);
    destination = safeNext(formData.get("next")) ?? (isStaff(user.role) ? "/admin" : "/account");
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    console.error("[login]", error);
    return { error: "Não foi possível entrar. Tenta novamente." };
  }
  redirect(destination);
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const ip = await getRequestIp();
  if (!rateLimit(`register:${ip}`, 5, 30 * 60_000)) {
    return { error: "Demasiados registos a partir desta ligação. Tenta mais tarde." };
  }
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Indica o teu nome.").max(120),
      email: z.email("E-mail inválido.").max(160),
      phone: z.string().trim().max(20).optional(),
      password: z.string().min(MIN_PASSWORD_LENGTH, `A palavra-passe precisa de ${MIN_PASSWORD_LENGTH} caracteres.`).max(200),
      acceptTerms: z.literal("on", { error: "Tens de aceitar os termos e a política de privacidade." }),
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      password: formData.get("password"),
      acceptTerms: formData.get("acceptTerms"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await registerUser(parsed.data);
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    console.error("[register]", error);
    return { error: "Não foi possível criar a conta. Tenta novamente." };
  }
  redirect(safeNext(formData.get("next")) ?? "/account");
}

export async function logoutAction() {
  await logoutUser();
  redirect("/");
}
