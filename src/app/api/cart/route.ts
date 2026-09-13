import { NextResponse } from "next/server";
import { z } from "zod";
import { safe } from "@/lib/db";
import { priceCart } from "@/lib/orders";

const schema = z.object({
  items: z
    .array(z.object({ variantId: z.string().min(1).max(40), quantity: z.number().int().min(1).max(99) }))
    .max(50),
});

/** Preços e stock atuais do carrinho — o browser nunca decide o preço. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ lines: [] }, { status: 400 });
  const lines = await safe(() => priceCart(parsed.data.items), []);
  return NextResponse.json({ lines });
}
