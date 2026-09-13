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

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

type Node = { name: string; slug: string; home?: boolean; children?: Node[] };

const CATEGORIES: Node[] = [
  {
    name: "Futebol",
    slug: "futebol",
    home: true,
    children: [
      { name: "Camisolas de clubes", slug: "camisolas-clubes" },
      { name: "Camisolas de seleções", slug: "camisolas-selecoes" },
      { name: "Retro", slug: "retro" },
      { name: "Chuteiras", slug: "chuteiras" },
    ],
  },
  {
    name: "Roupas",
    slug: "roupas",
    home: true,
    children: [
      { name: "T-shirts", slug: "t-shirts" },
      { name: "Oversized", slug: "oversized" },
      { name: "Hoodies", slug: "hoodies" },
      { name: "Sweatshirts", slug: "sweatshirts" },
      { name: "Calças", slug: "calcas" },
      { name: "Jeans", slug: "jeans" },
      { name: "Casacos", slug: "casacos" },
      { name: "Jaquetas", slug: "jaquetas" },
      { name: "Camisas", slug: "camisas" },
      { name: "Shorts", slug: "shorts" },
      { name: "Conjuntos", slug: "conjuntos" },
      { name: "Fatos de treino", slug: "fatos-de-treino" },
      { name: "Coletes", slug: "coletes" },
    ],
  },
  { name: "Sneakers", slug: "sneakers", home: true },
  { name: "Calçado", slug: "calcado", home: true },
  {
    name: "Acessórios",
    slug: "acessorios",
    home: true,
    children: [
      { name: "Bonés", slug: "bones" },
      { name: "Bolsas", slug: "bolsas" },
      { name: "Outros acessórios", slug: "outros-acessorios" },
    ],
  },
];

const LEGAL_PAGES = [
  { slug: "termos", title: "Termos e condições" },
  { slug: "privacidade", title: "Política de privacidade" },
  { slug: "cookies", title: "Política de cookies" },
  { slug: "trocas-devolucoes", title: "Trocas e devoluções" },
  { slug: "envios", title: "Envios" },
];

async function upsertTree(nodes: Node[], parentId: string | null) {
  let order = 0;
  for (const node of nodes) {
    // Só cria; se já existir, não mexe — o admin pode ter editado.
    const existing = await prisma.category.findUnique({ where: { slug: node.slug } });
    const category =
      existing ??
      (await prisma.category.create({
        data: {
          name: node.name,
          slug: node.slug,
          parentId,
          sortOrder: order,
          showOnHome: node.home ?? false,
        },
      }));
    order++;
    if (node.children) await upsertTree(node.children, category.id);
  }
}

async function main() {
  await upsertTree(CATEGORIES, null);

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
    await prisma.legalPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
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
          passwordHash: await hash(password, {
            memoryCost: 19456,
            timeCost: 2,
            parallelism: 1,
          }),
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
