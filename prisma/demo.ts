/**
 * Catálogo de DEMONSTRAÇÃO no banco — para apresentar o site ao cliente antes
 * de haver produtos reais. Os dados vivem em src/lib/demo-data.ts (os mesmos
 * que o site mostra quando corre sem banco).
 *
 *   npm run demo:seed    → cria os produtos demo (idempotente)
 *   npm run demo:clear   → apaga tudo o que é demo e repõe as imagens da loja
 *
 * Fotos gratuitas do Unsplash, nomes genéricos (sem clubes nem marcas reais),
 * SKU "DEMO-…", sem avaliações nem vendas inventadas. Nunca corre no deploy.
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { DEMO_CATEGORY_IMAGES, DEMO_HERO, DEMO_PRODUCTS, demoSlug } from "../src/lib/demo-data";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function seed() {
  const categories = await prisma.category.findMany();
  let created = 0;
  for (const [i, d] of DEMO_PRODUCTS.entries()) {
    const slug = demoSlug(d.name);
    if (await prisma.product.findUnique({ where: { slug } })) continue;
    const category = categories.find((c) => c.slug === d.category);
    const priceCents = Math.round(d.price * 100);
    const saleCents = d.sale ? Math.round(d.sale * 100) : null;
    await prisma.product.create({
      data: {
        name: d.name,
        slug,
        sku: `DEMO-${String(i + 1).padStart(3, "0")}`,
        status: "ACTIVE",
        categoryId: category?.id ?? null,
        priceCents,
        salePriceCents: saleCents,
        effectivePriceCents: saleCents ?? priceCents,
        description: `${d.text}\n\nProduto de demonstração — imagem ilustrativa.`,
        lowStockThreshold: 2,
        ...d.flags,
        images: { create: d.images.map((url, j) => ({ url, sortOrder: j, alt: d.name })) },
        variants: { create: d.sizes.map((size, j) => ({ size, stock: d.stock[j] ?? 0, sortOrder: j })) },
      },
    });
    created++;
  }

  for (const [slug, imageUrl] of Object.entries(DEMO_CATEGORY_IMAGES)) {
    await prisma.category.updateMany({ where: { slug, imageUrl: null }, data: { imageUrl } });
  }
  await prisma.storeSettings.updateMany({ where: { id: "store", heroImageUrl: null }, data: { heroImageUrl: DEMO_HERO } });

  console.log(`demo: ${created} produtos criados (${DEMO_PRODUCTS.length - created} já existiam).`);
}

async function clear() {
  const products = await prisma.product.findMany({ where: { sku: { startsWith: "DEMO-" } }, select: { id: true } });
  const ids = products.map((p) => p.id);
  const orders = await prisma.order.deleteMany({ where: { items: { some: { productId: { in: ids } } } } });
  const deleted = await prisma.product.deleteMany({ where: { id: { in: ids } } });
  await prisma.category.updateMany({ where: { imageUrl: { contains: "images.unsplash.com" } }, data: { imageUrl: null } });
  await prisma.storeSettings.updateMany({ where: { heroImageUrl: { contains: "images.unsplash.com" } }, data: { heroImageUrl: null } });
  console.log(`demo: ${deleted.count} produtos e ${orders.count} encomendas de teste apagados; imagens demo da loja removidas.`);
}

(process.argv[2] === "clear" ? clear() : seed())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
