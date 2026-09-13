import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { REVENUE_STATUSES } from "@/lib/order-status";
import { PageTitle } from "../ui";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q } = await searchParams;

  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, name: true, email: true, phone: true, createdAt: true, lastLoginAt: true },
  });

  const spend = await prisma.order.groupBy({
    by: ["userId"],
    where: { userId: { in: customers.map((c) => c.id) }, status: { in: REVENUE_STATUSES } },
    _sum: { totalCents: true },
    _count: { _all: true },
  });
  const byUser = new Map(spend.map((s) => [s.userId, s]));

  return (
    <div>
      <PageTitle title="Clientes" description={`${customers.length} com conta. Compras como convidado aparecem só nas encomendas.`} />
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Nome, e-mail ou telefone" className="field max-w-sm min-h-10 py-2" aria-label="Procurar clientes" />
        <button className="btn btn-outline min-h-10">Procurar</button>
      </form>
      <div className="overflow-x-auto border border-ink/10 bg-white">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-paper-2/60 text-left">
            <tr className="[&>th]:px-3 [&>th]:py-2.5"><th>Cliente</th><th>Telefone</th><th>Registo</th><th>Encomendas pagas</th><th className="text-right">Total gasto</th></tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {customers.map((c) => {
              const s = byUser.get(c.id);
              return (
                <tr key={c.id} className="[&>td]:px-3 [&>td]:py-2.5">
                  <td><span className="block font-medium">{c.name}</span><a href={`mailto:${c.email}`} className="text-xs text-muted underline">{c.email}</a></td>
                  <td>{c.phone ?? "—"}</td>
                  <td className="text-muted">{formatDate(c.createdAt)}</td>
                  <td>{s?._count._all ?? 0}</td>
                  <td className="text-right font-semibold tabular-nums">{formatPrice(s?._sum.totalCents ?? 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {customers.length === 0 && <p className="p-8 text-center text-muted">Sem clientes.</p>}
      </div>
    </div>
  );
}
