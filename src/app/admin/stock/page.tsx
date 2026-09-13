import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { Card, Notice, PageTitle } from "../ui";
import { adjustStock } from "./actions";

const REASON: Record<string, string> = { SALE: "Venda", RESTOCK: "Reposição", ADJUSTMENT: "Ajuste", ORDER_CANCELLED: "Cancelamento" };

type Props = { searchParams: Promise<{ q?: string; todos?: string; ok?: string; erro?: string }> };

export default async function StockPage({ searchParams }: Props) {
  await requireStaff();
  const { q, todos, ok, erro } = await searchParams;

  const variants = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      product: { status: { not: "ARCHIVED" }, ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) },
      ...(todos || q ? {} : { stock: { lte: 10 } }),
    },
    include: { product: { select: { id: true, name: true, lowStockThreshold: true } } },
    orderBy: [{ stock: "asc" }, { product: { name: "asc" } }],
    take: 300,
  });
  const rows = todos || q ? variants : variants.filter((v) => v.stock <= v.product.lowStockThreshold);

  const movements = await prisma.inventoryMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    include: { variant: { select: { size: true, color: true, product: { select: { name: true } } } } },
  });

  return (
    <div>
      {ok && <Notice>Stock atualizado.</Notice>}
      {erro && <Notice tone="error">Valor de stock inválido.</Notice>}
      <PageTitle title="Stock" description={todos || q ? "Todas as variantes" : "Tamanhos no limite de stock baixo ou esgotados"} />

      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Procurar produto" className="field max-w-xs min-h-10 py-2" aria-label="Procurar produto" />
        <button className="btn btn-outline min-h-10">Procurar</button>
        <Link href={todos ? "/admin/stock" : "/admin/stock?todos=1"} className="btn min-h-10 underline">
          {todos ? "Só stock baixo" : "Ver todas"}
        </Link>
      </form>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto border border-ink/10 bg-white">
          {rows.length === 0 ? (
            <p className="p-8 text-center text-muted">Nada com stock baixo. 👌</p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-paper-2/60 text-left">
                <tr className="[&>th]:px-3 [&>th]:py-2.5"><th>Produto</th><th>Variante</th><th>Stock</th><th>Novo valor</th></tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {rows.map((v) => (
                  <tr key={v.id} className="[&>td]:px-3 [&>td]:py-2">
                    <td><Link href={`/admin/produtos/${v.product.id}`} className="font-medium hover:underline">{v.product.name}</Link></td>
                    <td className="text-muted">{[v.size, v.color].filter(Boolean).join(" / ") || "—"}</td>
                    <td><span className={`tag px-2 py-0.5 ${v.stock === 0 ? "bg-danger text-white" : v.stock <= v.product.lowStockThreshold ? "bg-amber-100" : "bg-paper-2"}`}>{v.stock}</span></td>
                    <td>
                      <form action={adjustStock} className="flex gap-2">
                        <input type="hidden" name="variantId" value={v.id} />
                        <input type="number" name="stock" min={0} defaultValue={v.stock} className="field min-h-9 w-20 py-1" aria-label="Novo stock" />
                        <select name="reason" className="field min-h-9 w-auto py-1" aria-label="Motivo">
                          <option value="RESTOCK">Reposição</option>
                          <option value="ADJUSTMENT">Ajuste</option>
                        </select>
                        <button className="btn btn-primary min-h-9 px-3 text-xs">OK</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Card title="Movimentos recentes">
          {movements.length === 0 ? (
            <p className="text-sm text-muted">Sem movimentos.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {movements.map((m) => (
                <li key={m.id}>
                  <span className={`font-bold tabular-nums ${m.change < 0 ? "text-danger" : "text-emerald-700"}`}>{m.change > 0 ? `+${m.change}` : m.change}</span>{" "}
                  {m.variant.product.name}
                  {m.variant.size && <span className="text-muted"> · {m.variant.size}</span>}
                  <span className="block text-xs text-muted">{REASON[m.reason]} · {formatDateTime(m.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
