import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Migrações precisam de uma ligação de SESSÃO (DATABASE_URL_UNPOOLED: no
// Supabase, o session pooler na porta 5432). A app usa DATABASE_URL.
// Sem nenhuma das duas (ex.: `npm install` na Vercel antes de haver banco),
// o `prisma generate` tem de funcionar na mesma — por isso não se exige aqui.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  ...(url ? { datasource: { url } } : {}),
});
