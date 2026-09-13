import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrações precisam da ligação DIRETA. O Neon da Vercel dá DATABASE_URL
    // (pooler, usada pela app) e DATABASE_URL_UNPOOLED (direta).
    url: process.env.DATABASE_URL_UNPOOLED || env("DATABASE_URL"),
  },
});
