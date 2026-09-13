import Link from "next/link";
import { StatusBadge } from "@/components/order/order-summary";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatPrice, orderNumber } from "@/lib/format";

export default async function AccountOrdersPage() {
  const user = await requireUser();
  // Encomendas feitas na conta e, como convidado, com o mesmo e-mail.
  const orders = await prisma.order.findMany({
    where: { OR: [{ userId: user.id }, { userId: null, email: user.email }] },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
    take: 50,
  });

  if (orders.length === 0) {
    return (
      <div className="border-2 border-dashed border-ink/20 px-6 py-14 text-center">
        <p className="display text-4xl">Sem encomendas</p>
        <p className="mt-2 text-muted">Quando comprares, as encomendas aparecem aqui com o estado atualizado.</p>
        <Link href="/produtos" className="btn btn-primary mt-6">
          Ir à loja
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-ink/10 border-y border-ink/10">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/account/encomendas/${orderNumber(o.seq)}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 hover:bg-ink/[0.03]">
            <span className="font-mono font-semibold">{orderNumber(o.seq)}</span>
            <span className="text-sm text-muted">{formatDate(o.createdAt)}</span>
            <span className="text-sm text-muted">
              {o._count.items} {o._count.items === 1 ? "artigo" : "artigos"}
            </span>
            <StatusBadge status={o.status} />
            <span className="ml-auto font-bold tabular-nums">{formatPrice(o.totalCents)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
