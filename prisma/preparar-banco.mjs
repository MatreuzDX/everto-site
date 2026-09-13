/**
 * Prepara o banco de produção no build da Vercel, antes do `next build`:
 *   1. `prisma migrate deploy`
 *   2. seed idempotente (categorias base, definições, conta admin se
 *      SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD existirem). Nunca cria produtos.
 *
 * A migração entra ANTES do código que depende dela; se falhar, o build falha
 * e a Vercel mantém o deploy anterior no ar.
 * Só corre em produção — previews não mexem no schema de produção.
 */

import { execSync, spawnSync } from "node:child_process";

if (process.env.VERCEL && process.env.VERCEL_ENV !== "production") {
  console.log(`preparar-banco: ambiente "${process.env.VERCEL_ENV}" — saltado.`);
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.warn(
    "\n⚠ preparar-banco: DATABASE_URL não definida — migrações e seed saltados.\n" +
      "  A loja abre sem produtos; login e admin não funcionam.\n" +
      "  Resolver: Vercel → projeto → Storage → Create Database (Neon) → ligar → Redeploy.\n",
  );
  process.exit(0);
}

console.log("\npreparar-banco: a aplicar migrações");
const migrar = spawnSync("npx prisma migrate deploy", { shell: true, encoding: "utf8" });
process.stdout.write(migrar.stdout ?? "");
process.stderr.write(migrar.stderr ?? "");
if (migrar.status !== 0) {
  console.error("\npreparar-banco: a migração falhou — build parado.\n");
  process.exit(1);
}

console.log("\npreparar-banco: seed base");
execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
console.log("\npreparar-banco: banco pronto.\n");
