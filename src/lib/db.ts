/**
 * Cliente Prisma (singleton, criado só à primeira consulta).
 *
 * Criado no import, uma DATABASE_URL em falta rebentava o `next build` e
 * qualquer página. Assim só falha quem lê mesmo do banco — e as páginas
 * públicas usam `safe()` para mostrar a loja vazia em vez de um erro 500.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não está definida. Produção: Vercel → Storage → Neon. Local: npm run db:start e .env.",
    );
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    globalThis.__prisma ??= createClient();
    const client = globalThis.__prisma;
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/** Leitura pública tolerante: regista o erro e devolve o valor de recurso. */
export async function safe<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error("[db] consulta pública falhou:", error instanceof Error ? error.message : error);
    return fallback;
  }
}
