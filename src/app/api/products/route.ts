import { NextResponse } from "next/server";
import { getCardsByIds } from "@/lib/catalog";

/** Cartões por ids — usado pela página de favoritos. */
export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 40)
    .slice(0, 100);
  return NextResponse.json({ products: await getCardsByIds(ids) });
}
