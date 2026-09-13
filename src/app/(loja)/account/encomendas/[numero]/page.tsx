import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderSummary, StatusBadge } from "@/components/order/order-summary";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime, orderNumber, parseOrderNumber } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/order-status";

export default async function AccountOrderPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  const user = await requireUser();
  const seq = parseOrderNumber(numero);
  if (!seq) notFound();

  const order = await prisma.order.findFirst({
    where: { seq, OR: [{ userId: user.id }, { userId: null, email: user.email }] },
    include: { items: true, history: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();

  return (
    <div>
      <Link href="/account" className="text-sm underline">
        ← Encomendas
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h2 className="display text-4xl">{orderNumber(order.seq)}</h2>
        <StatusBadge status={order.status} />
      </div>

      <ol className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
        {order.history.map((h) => (
          <li key={h.id} className="text-sm">
            <span className="font-semibold">{ORDER_STATUS[h.status].label}</span>{" "}
            <span className="text-muted">{formatDateTime(h.createdAt)}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <OrderSummary order={order} />
      </div>
    </div>
  );
}
