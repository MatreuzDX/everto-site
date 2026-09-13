import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const idSchema = z.string().min(1).max(40);

/** Junta favoritos locais à conta e devolve a lista. Sem sessão: loggedIn=false. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ loggedIn: false, ids: [] });

  const body = await request.json().catch(() => ({}));
  const parsed = z.object({ merge: z.array(idSchema).max(100).optional() }).safeParse(body);
  const merge = parsed.success ? (parsed.data.merge ?? []) : [];

  if (merge.length > 0) {
    const existing = await prisma.product.findMany({ where: { id: { in: merge } }, select: { id: true } });
    await prisma.wishlistItem.createMany({
      data: existing.map((p) => ({ userId: user.id, productId: p.id })),
      skipDuplicates: true,
    });
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { productId: true },
  });
  return NextResponse.json({ loggedIn: true, ids: items.map((i) => i.productId) });
}

async function productIdFrom(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = z.object({ productId: idSchema }).safeParse(body);
  return parsed.success ? parsed.data.productId : null;
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  const productId = await productIdFrom(request);
  if (!user || !productId) return NextResponse.json({ ok: false }, { status: 400 });
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (product) {
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      update: {},
      create: { userId: user.id, productId },
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  const productId = await productIdFrom(request);
  if (!user || !productId) return NextResponse.json({ ok: false }, { status: 400 });
  await prisma.wishlistItem.deleteMany({ where: { userId: user.id, productId } });
  return NextResponse.json({ ok: true });
}
