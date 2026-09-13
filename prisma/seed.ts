/**
 * Seed idempotente. Cria só ESTRUTURA:
 *   - categorias base (editáveis e apagáveis no admin)
 *   - linha de definições da loja, com o Instagram oficial
 *   - páginas legais vazias, para preencher no admin
 *   - conta ADMIN, se SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD existirem
 *
 * Nunca cria produtos, preços, stock, marcas, contactos nem avaliações.
 */

import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { BASE_CATEGORIES, type CategoryNode } from "../src/lib/base-categories";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const LEGAL_PAGES = [
  { slug: "termos", title: "Termos e condições" },
  { slug: "privacidade", title: "Política de privacidade" },
  { slug: "cookies", title: "Política de cookies" },
  { slug: "trocas-devolucoes", title: "Trocas e devoluções" },
  { slug: "envios", title: "Envios" },
];

async function upsertTree(nodes: CategoryNode[], parentId: string | null) {
  let order = 0;
  for (const node of nodes) {
    // Só cria; se já existir, não mexe — o admin pode ter editado.
    const existing = await prisma.category.findUnique({ where: { slug: node.slug } });
    const category =
      existing ??
      (await prisma.category.create({
        data: { name: node.name, slug: node.slug, parentId, sortOrder: order, showOnHome: node.home ?? false },
      }));
    order++;
    if (node.children) await upsertTree(node.children, category.id);
  }
}

async function main() {
  await upsertTree(BASE_CATEGORIES, null);

  await prisma.storeSettings.upsert({
    where: { id: "store" },
    update: {},
    create: {
      id: "store",
      storeName: "CAETANO IMPORTZ",
      // Único contacto confirmado: o Instagram indicado pelo cliente.
      instagramUrl: "https://www.instagram.com/caetano_importz/",
      heroTitle: "Estilo importado. Identidade única.",
    },
  });

  for (const page of LEGAL_PAGES) {
    await prisma.legalPage.upsert({ where: { slug: page.slug }, update: {}, create: page });
  }

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (!exists) {
      await prisma.user.create({
        data: {
          email,
          name: process.env.SEED_ADMIN_NAME || "Administração",
          role: "ADMIN",
          passwordHash: await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 }),
        },
      });
      console.log(`seed: conta ADMIN criada (${email})`);
    }
  } else {
    console.log("seed: SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD vazias — sem conta admin.");
  }

  console.log("seed: concluído");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
