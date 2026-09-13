/**
 * Métodos de pagamento.
 *
 * Fase 1: só "WHATSAPP" (a encomenda fica registada com pagamento pendente e
 * a loja combina o pagamento com o cliente). Os métodos de gateway aparecem
 * no checkout como "Brevemente" até existirem credenciais reais E o adaptador
 * estar implementado — nunca se finge um pagamento.
 *
 * Para ativar a ifthenpay (Fase 2):
 *   1. Contrato ifthenpay (exige atividade aberta nas Finanças).
 *   2. Chaves nas variáveis de ambiente (ver .env.example).
 *   3. Implementar `startGatewayPayment` para o método e o endpoint de
 *      callback em src/app/api/payments/ifthenpay/route.ts, que chama
 *      `changeOrderStatus(orderId, "PAID")` depois de validar a chave
 *      anti-phishing.
 *   4. Acrescentar o método a IMPLEMENTED.
 */

export type PaymentMethodId = "WHATSAPP" | "MBWAY" | "MULTIBANCO" | "CARD";

export const PAYMENT_METHODS: Record<
  PaymentMethodId,
  { label: string; description: string; provider: string; env: string[] }
> = {
  MBWAY: {
    label: "MB WAY",
    description: "Confirma no telemóvel, em segundos.",
    provider: "ifthenpay",
    env: ["IFTHENPAY_MBWAY_KEY", "IFTHENPAY_ANTI_PHISHING_KEY"],
  },
  MULTIBANCO: {
    label: "Referência Multibanco",
    description: "Paga no multibanco ou no homebanking.",
    provider: "ifthenpay",
    env: ["IFTHENPAY_MULTIBANCO_KEY", "IFTHENPAY_ANTI_PHISHING_KEY"],
  },
  CARD: {
    label: "Cartão, Apple Pay e Google Pay",
    description: "Visa, Mastercard e carteiras digitais.",
    provider: "ifthenpay",
    env: ["IFTHENPAY_CCARD_KEY", "IFTHENPAY_ANTI_PHISHING_KEY"],
  },
  WHATSAPP: {
    label: "Combinar pelo WhatsApp",
    description: "Registamos a encomenda e combinamos o pagamento contigo.",
    provider: "manual",
    env: [],
  },
};

const IMPLEMENTED = new Set<PaymentMethodId>(["WHATSAPP"]);

export function isMethodReady(id: PaymentMethodId): boolean {
  return IMPLEMENTED.has(id) && PAYMENT_METHODS[id].env.every((key) => !!process.env[key]);
}

export function checkoutMethods(enabledInSettings: string[]) {
  const order: PaymentMethodId[] = ["MBWAY", "MULTIBANCO", "CARD", "WHATSAPP"];
  return order.map((id) => ({
    id,
    ...PAYMENT_METHODS[id],
    // WhatsApp está sempre disponível — é a rede de segurança da Fase 1.
    available: id === "WHATSAPP" || (enabledInSettings.includes(id) && isMethodReady(id)),
  }));
}
