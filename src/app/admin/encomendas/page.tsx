import type { OrderStatus, Prisma } from "@prisma/client";
import Link from "next/link";
import { StatusBadge } from "@/components/order/order-summary";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime, formatPrice, orderNumber, parseOrderNumber } from "@/lib/format";
import { ORDER_STATUS, ORDER_STATUS_LIST } from "@/lib/order-status";
import { PageTitle } from "../ui";

type Props = { searchParams: Promise<{ q?: string; estado?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireStaff();
  const { q, estado } = await searchParams;
  const seq = q ? parseOrderNumber(q) : null;

  const where: Prisma.OrderWhereInput = {
    ...(estado && (ORDER_STATUS_LIST as string[]).includes(estado) ? { status: estado as OrderStatus } : {}),
    ...(q
      ? {
          OR: [
            ...(seq ? [{ seq }] : []),
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, include: { _count: { select: { items: true } } } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countOf = (s: OrderStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;

  return (
    <div>
      <PageTitle title="Encomendas" />

      <div className="no-scrollbar mb-4 flex gap-1 overflow-x-auto">
        <Link href="/admin/encomendas" className={`tag shrink-0 px-3 py-2 ${!estado ? "bg-ink text-paper" : "bg-white"}`}>Todas</Link>
        {ORDER_STATUS_LIST.map((s) => (
          <Link key={s} href={`/admin/encomendas?estado=${s}`} className={`tag shrink-0 px-3 py-2 ${estado === s ? "bg-ink text-paper" : "bg-white"}`}>
            {ORDER_STATUS[s].label} ({countOf(s)})
          </Link>
        ))}
      </div>

      <form className="mb-4 flex gap-2">
        {estado && <input type="hidden" name="estado" value={estado} />}
        <input name="q" defaultValue={q} placeholder="Nº (CI00001), nome, e-mail ou telefone" className="field max-w-md min-h-10 py-2" aria-label="Pesquisar encomendas" />
        <button className="btn btn-outline min-h-10">Procurar</button>
      </form>

      {orders.length === 0 ? (
        <p className="border border-ink/10 bg-white p-8 text-center text-muted">Sem encomendas.</p>
      ) : (
        <div className="overflow-x-auto border border-ink/10 bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-paper-2/60 text-left">
              <tr className="[&>th]:px-3 [&>th]:py-2.5">
                <th>Nº</th><th>Cliente</th><th>Data</th><th>Artigos</th><th>Pagamento</th><th>Estado</th><th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-paper/50 [&>td]:px-3 [&>td]:py-2.5">
                  <td><Link href={`/admin/encomendas/${o.id}`} className="font-mono font-semibold underline">{orderNumber(o.seq)}</Link></td>
                  <td><span className="block font-medium">{o.name}</span><span className="text-xs text-muted">{o.email}</span></td>
                  <td className="text-muted">{formatDateTime(o.createdAt)}</td>
                  <td>{o._count.items}</td>
                  <td className="text-xs">{o.paymentMethod}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-right font-semibold tabular-nums">{formatPrice(o.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
