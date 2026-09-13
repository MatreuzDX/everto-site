import Link from "next/link";
import { StatusBadge } from "@/components/order/order-summary";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime, formatPrice, orderNumber } from "@/lib/format";
import { REVENUE_STATUSES } from "@/lib/order-status";
import { Card, Notice, PageTitle, Stat } from "./ui";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const user = await requireStaff();
  const { erro } = await searchParams;
  const since30 = daysAgo(30);
  const since14 = daysAgo(13);
  since14.setHours(0, 0, 0, 0);

  const [revenueAll, revenue30, pendingPayment, activeProducts, customers, newCustomers, lowVariants, latest, recent, topItems] =
    await Promise.all([
      prisma.order.aggregate({ where: { status: { in: REVENUE_STATUSES } }, _sum: { totalCents: true }, _count: { _all: true } }),
      prisma.order.aggregate({
        where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: since30 } },
        _sum: { totalCents: true },
        _count: { _all: true },
      }),
      prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: since30 } } }),
      prisma.productVariant.findMany({
        where: { isActive: true, stock: { lte: 10 }, product: { status: "ACTIVE" } },
        include: { product: { select: { id: true, name: true, lowStockThreshold: true } } },
        orderBy: { stock: "asc" },
        take: 60,
      }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.order.findMany({
        where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: since14 } },
        select: { createdAt: true, totalCents: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productId", "name"],
        where: { order: { status: { in: REVENUE_STATUSES } }, productId: { not: null } },
        _sum: { quantity: true, unitPriceCents: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

  const lowStock = lowVariants.filter((v) => v.stock <= v.product.lowStockThreshold);
  const orders30 = revenue30._count._all;
  const avgTicket = orders30 > 0 ? Math.round((revenue30._sum.totalCents ?? 0) / orders30) : 0;

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since14);
    d.setDate(d.getDate() + i);
    return d;
  });
  const perDay = days.map((d) => {
    const key = d.toDateString();
    const cents = recent.filter((o) => new Date(o.createdAt).toDateString() === key).reduce((s, o) => s + o.totalCents, 0);
    return { d, cents };
  });
  const maxDay = Math.max(1, ...perDay.map((p) => p.cents));

  return (
    <div>
      {erro === "sem-permissao" && <Notice tone="error">Essa área é só para administradores.</Notice>}
      <PageTitle title="Painel" description={`Olá, ${user.name.split(" ")[0]}. Resumo da loja.`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Receita (30 dias)" value={formatPrice(revenue30._sum.totalCents ?? 0)} hint={`Total: ${formatPrice(revenueAll._sum.totalCents ?? 0)}`} />
        <Stat label="Encomendas pagas (30 dias)" value={orders30} hint={`${pendingPayment} a aguardar pagamento`} />
        <Stat label="Ticket médio (30 dias)" value={formatPrice(avgTicket)} />
        <Stat label="Clientes" value={customers} hint={`${newCustomers} novos em 30 dias`} />
        <Stat label="Produtos ativos" value={activeProducts} />
        <Stat label="Tamanhos com stock baixo" value={lowStock.length} />
        <Stat label="Unidades vendidas" value={topItems.reduce((s, t) => s + (t._sum.quantity ?? 0), 0)} hint="Top 5 produtos" />
        <Stat label="Taxa de conversão" value="—" hint="Precisa do Google Analytics ligado" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Receita — últimos 14 dias">
          <div className="flex h-44 items-end gap-1.5" role="img" aria-label="Gráfico de receita diária">
            {perDay.map(({ d, cents }) => (
              <div key={d.toISOString()} className="group flex h-full flex-1 flex-col justify-end">
                <div
                  className="relative bg-ink transition group-hover:bg-lime-dark"
                  style={{ height: `${Math.max(cents > 0 ? 4 : 1, (cents / maxDay) * 100)}%` }}
                  title={`${d.toLocaleDateString("pt-PT")}: ${formatPrice(cents)}`}
                />
                <span className="tag mt-1 text-center text-[0.55rem] text-muted">{d.getDate()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Mais vendidos">
          {topItems.length === 0 ? (
            <p className="text-sm text-muted">Ainda sem vendas confirmadas.</p>
          ) : (
            <ol className="space-y-3 text-sm">
              {topItems.map((t, i) => (
                <li key={`${t.productId}-${t.name}`} className="flex items-center gap-3">
                  <span className="tag w-5 text-muted">{i + 1}</span>
                  <Link href={`/admin/produtos/${t.productId}`} className="flex-1 truncate font-medium hover:underline">
                    {t.name}
                  </Link>
                  <span className="font-bold tabular-nums">{t._sum.quantity} un.</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Últimas encomendas">
          {latest.length === 0 ? (
            <p className="text-sm text-muted">Ainda não há encomendas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <tbody className="divide-y divide-ink/10">
                  {latest.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2.5">
                        <Link href={`/admin/encomendas/${o.id}`} className="font-mono font-semibold hover:underline">
                          {orderNumber(o.seq)}
                        </Link>
                      </td>
                      <td className="py-2.5">{o.name}</td>
                      <td className="py-2.5 text-muted">{formatDateTime(o.createdAt)}</td>
                      <td className="py-2.5"><StatusBadge status={o.status} /></td>
                      <td className="py-2.5 text-right font-semibold tabular-nums">{formatPrice(o.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Stock baixo">
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted">Nenhum tamanho abaixo do limite.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {lowStock.slice(0, 10).map((v) => (
                <li key={v.id} className="flex items-center gap-3">
                  <Link href={`/admin/produtos/${v.product.id}`} className="flex-1 truncate hover:underline">
                    {v.product.name}
                    <span className="text-muted">{[v.size, v.color].filter(Boolean).length ? ` · ${[v.size, v.color].filter(Boolean).join(" / ")}` : ""}</span>
                  </Link>
                  <span className={`tag px-2 py-0.5 ${v.stock === 0 ? "bg-danger text-white" : "bg-amber-100"}`}>{v.stock}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/stock" className="mt-4 inline-block text-sm font-semibold underline">
            Gerir stock →
          </Link>
        </Card>
      </div>
    </div>
  );
}
