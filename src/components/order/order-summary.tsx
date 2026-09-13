import type { Order, OrderItem } from "@prisma/client";
import Image from "next/image";
import { countryName } from "@/lib/countries";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/order-status";
import { PAYMENT_METHODS, type PaymentMethodId } from "@/lib/payments";

export function StatusBadge({ status }: { status: Order["status"] }) {
  const s = ORDER_STATUS[status];
  return <span className={`tag inline-block px-2 py-1 ${s.tone}`}>{s.label}</span>;
}

export function OrderSummary({ order }: { order: Order & { items: OrderItem[] } }) {
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-ink/10 border-y border-ink/10">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-4 py-4">
            <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-paper-2">
              {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{item.name}</p>
              <p className="tag text-muted">
                {[item.size && `Tam. ${item.size}`, item.color, `${item.quantity} × ${formatPrice(item.unitPriceCents)}`].filter(Boolean).join(" · ")}
              </p>
            </div>
            <p className="font-semibold tabular-nums">{formatPrice(item.unitPriceCents * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="space-y-6 text-sm">
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(order.subtotalCents)}</dd>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between">
              <dt>Desconto</dt>
              <dd className="tabular-nums">−{formatPrice(order.discountCents)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Envio{order.shippingLabel ? ` · ${order.shippingLabel}` : ""}</dt>
            <dd className="tabular-nums">{order.shippingCents === 0 ? (order.shippingMethodId ? "Grátis" : "—") : formatPrice(order.shippingCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(order.totalCents)}</dd>
          </div>
        </dl>
        <div>
          <p className="label">Entrega</p>
          <p className="leading-relaxed">
            {order.name}
            <br />
            {order.line1}
            {order.line2 && <>, {order.line2}</>}
            <br />
            {order.postalCode} {order.city}, {countryName(order.country)}
          </p>
        </div>
        <div>
          <p className="label">Pagamento</p>
          <p>{PAYMENT_METHODS[order.paymentMethod as PaymentMethodId]?.label ?? order.paymentMethod}</p>
        </div>
        {order.trackingCode && (
          <div>
            <p className="label">Seguimento</p>
            <p className="font-mono">{order.trackingCode}</p>
          </div>
        )}
      </div>
    </div>
  );
}
