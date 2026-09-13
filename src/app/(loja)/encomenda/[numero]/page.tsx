import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/layout/whatsapp-float";
import { OrderSummary, StatusBadge } from "@/components/order/order-summary";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { orderNumber, parseOrderNumber } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { orderMessage, whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Encomenda", robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ numero: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function OrderPage({ params, searchParams }: Props) {
  const [{ numero }, { t }] = await Promise.all([params, searchParams]);
  const seq = parseOrderNumber(numero);
  if (!seq) notFound();

  const [order, user, settings] = await Promise.all([
    prisma.order.findUnique({ where: { seq }, include: { items: true } }),
    getCurrentUser(),
    getSettings(),
  ]);

  // Acesso: token secreto do link, dono da conta ou equipa. Caso contrário 404
  // (não revelar que a encomenda existe).
  const allowed = order && ((t && t === order.accessToken) || (user && (user.id === order.userId || isStaff(user.role))));
  if (!order || !allowed) notFound();

  const number = orderNumber(order.seq);
  const wa =
    order.paymentMethod === "WHATSAPP" && order.status === "PENDING_PAYMENT"
      ? whatsappLink(settings.whatsappNumber, orderMessage({ number, totalCents: order.totalCents, items: order.items }))
      : null;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-8 md:px-6 md:pt-12">
      <p className="tag text-muted">Encomenda {number}</p>
      <h1 className="display mt-2 text-6xl md:text-8xl">
        {order.status === "PENDING_PAYMENT" ? "Encomenda registada" : "A tua encomenda"}
      </h1>
      <div className="mt-4">
        <StatusBadge status={order.status} />
      </div>

      {order.status === "PENDING_PAYMENT" && (
        <div className="mt-8 bg-ink p-6 text-paper md:p-8">
          <p className="display text-3xl text-lime md:text-4xl">Último passo: pagamento</p>
          {order.paymentMethod === "WHATSAPP" ? (
            <>
              <p className="mt-3 max-w-xl text-paper/80">
                Reservámos os detalhes da tua encomenda. Envia-nos mensagem no WhatsApp para combinarmos o pagamento e o envio.
              </p>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-6 h-14 w-full sm:w-auto sm:px-10">
                  <WhatsAppIcon className="h-5 w-5" /> Enviar encomenda pelo WhatsApp
                </a>
              ) : (
                <p className="mt-4 text-paper/80">A loja vai contactar-te pelo e-mail ou telefone indicados.</p>
              )}
            </>
          ) : (
            <p className="mt-3 text-paper/80">As instruções de pagamento foram registadas. A loja confirma assim que o pagamento chegar.</p>
          )}
          <p className="tag mt-5 text-paper/60">
            Guarda este link — dá acesso à encomenda.
          </p>
        </div>
      )}

      <div className="mt-10">
        <OrderSummary order={order} />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/produtos" className="btn btn-outline">
          Continuar a comprar
        </Link>
        {!user && (
          <Link href={`/register?email=${encodeURIComponent(order.email)}`} className="btn btn-primary">
            Criar conta para seguir encomendas
          </Link>
        )}
      </div>
    </div>
  );
}
