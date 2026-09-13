/**
 * Autenticação: palavra-passe com Argon2id, sessão com token opaco guardado
 * como hash SHA-256 e cookie httpOnly. Mesmo padrão do ayaha-crm.
 *
 * Proteção real é sempre no servidor (layouts e cada Server Action chamam
 * `requireStaff`/`requireAdmin`). O proxy só evita pedidos inúteis.
 */

import { createHash, randomBytes } from "node:crypto";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import type { Role } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "./db";

export const SESSION_COOKIE = "ci_session";
const SESSION_DAYS = 30;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
export const MIN_PASSWORD_LENGTH = 8;

const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 };
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$RdescudvJCsgt3ub+b+dWRWJTmaaJObG";

export class AuthError extends Error {}

export function hashPassword(plain: string) {
  return argonHash(plain, ARGON);
}

export async function verifyPassword(hashed: string, plain: string) {
  try {
    return await argonVerify(hashed, plain);
  } catch {
    return false;
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getRequestIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

async function startSession(userId: string) {
  const h = await headers();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      ip: await getRequestIp(),
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
    },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    throw new AuthError("Já existe uma conta com este e-mail.");
  }
  const user = await prisma.user.create({
    data: {
      email,
      name: input.name.trim(),
      phone: input.phone || null,
      passwordHash: await hashPassword(input.password),
    },
  });
  await startSession(user.id);
  return user;
}

export async function loginUser(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  const generic = new AuthError("E-mail ou palavra-passe incorretos.");
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    // Trabalho constante para não revelar pelo tempo se a conta existe.
    await verifyPassword(DUMMY_HASH, password);
    throw generic;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
    throw new AuthError(`Demasiadas tentativas. Tente daqui a ${minutes} min.`);
  }

  if (!(await verifyPassword(user.passwordHash, password))) {
    const failed = user.failedLogins + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: failed >= MAX_FAILED_LOGINS ? 0 : failed,
        lockedUntil:
          failed >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });
    throw generic;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await startSession(user.id);
  return user;
}

export async function logoutUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {});
  }
  store.delete(SESSION_COOKIE);
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
};

/** Utilizador da sessão atual (deduplicado por pedido). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true, isActive: true } },
      },
    });
    if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
    const { id, name, email, phone, role } = session.user;
    return { id, name, email, phone, role };
  } catch {
    return null;
  }
});

export function isStaff(role: Role | undefined) {
  return role === "ADMIN" || role === "STAFF";
}

export async function requireUser(next = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Páginas e ações do admin: ADMIN ou STAFF. */
export async function requireStaff() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isStaff(user.role)) redirect("/");
  return user;
}

/** Configurações críticas e utilizadores: só ADMIN. */
export async function requireAdmin() {
  const user = await requireStaff();
  if (user.role !== "ADMIN") redirect("/admin?erro=sem-permissao");
  return user;
}
