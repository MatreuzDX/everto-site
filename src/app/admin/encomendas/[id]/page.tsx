import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderSummary, StatusBadge } from "@/components/order/order-summary";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime, orderNumber } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/order-status";
import { whatsappLink } from "@/lib/whatsapp";
import { Card, PageTitle } from "../../ui";
import { saveInternalNote } from "../actions";
import { StatusForm } from "./status-form";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, history: { orderBy: { createdAt: "desc" } }, payments: true, user: { select: { id: true, name: true } } },
  });
  if (!order) notFound();

  const number = orderNumber(order.seq);
  const wa = whatsappLink(order.phone.replace(/^(\d{9})$/, "351$1"), `Olá ${order.name.split(" ")[0]}! Sobre a sua encomenda ${number} na Caetano Importz:`);

  return (
    <div>
      <Link href="/admin/encomendas" className="text-sm underline">← Encomendas</Link>
      <PageTitle
        title={number}
        description={`Criada a ${formatDateTime(order.createdAt)} · ${order.channel}`}
        actions={<StatusBadge status={order.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="Artigos">
            <OrderSummary order={order} />
          </Card>

          <Card title="Histórico">
            <ol className="space-y-3 text-sm">
              {order.history.map((h) => (
                <li key={h.id} className="flex flex-wrap gap-x-3">
                  <span className="font-semibold">{ORDER_STATUS[h.status].label}</span>
                  <span className="text-muted">{formatDateTime(h.createdAt)}</span>
                  {h.note && <span className="w-full text-ink/80">{h.note}</span>}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Estado">
            <StatusForm orderId={order.id} status={order.status} trackingCode={order.trackingCode ?? ""} stockCommitted={Boolean(order.stockCommittedAt)} />
          </Card>

          <Card title="Cliente">
            <p className="font-semibold">{order.name}</p>
            <p className="mt-1 text-sm"><a href={`mailto:${order.email}`} className="underline">{order.email}</a></p>
            <p className="text-sm"><a href={`tel:${order.phone}`} className="underline">{order.phone}</a></p>
            {order.user && <p className="tag mt-2 text-muted">Cliente com conta</p>}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-4 min-h-10 w-full">
                WhatsApp ao cliente
              </a>
            )}
            {order.customerNote && (
              <div className="mt-4 bg-amber-50 p-3 text-sm">
                <p className="label">Nota do cliente</p>
                <p className="whitespace-pre-line">{order.customerNote}</p>
              </div>
            )}
          </Card>

          <Card title="Nota interna">
            <form action={saveInternalNote} className="space-y-2">
              <input type="hidden" name="orderId" value={order.id} />
              <textarea name="internalNote" rows={3} defaultValue={order.internalNote ?? ""} className="field" aria-label="Nota interna" />
              <button className="btn btn-outline min-h-10">Guardar nota</button>
            </form>
          </Card>

          <Card title="Pagamentos">
            <ul className="space-y-1 text-sm">
              {order.payments.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.method} · {p.provider}</span>
                  <span className="tag">{p.status}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
