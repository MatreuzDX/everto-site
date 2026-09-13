import { formatPrice } from "./format";

export function whatsappLink(number: string | null | undefined, text?: string): string | null {
  const digits = (number ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function productMessage(input: {
  name: string;
  size?: string | null;
  color?: string | null;
  priceCents: number;
  url?: string;
}) {
  const parts = [`Olá! Tenho interesse no produto ${input.name}`];
  if (input.size) parts.push(`tamanho ${input.size}`);
  if (input.color) parts.push(`cor ${input.color}`);
  let text = `${parts.join(", ")}, no valor de ${formatPrice(input.priceCents)}.`;
  if (input.url) text += `\n${input.url}`;
  return text;
}

export function orderMessage(input: {
  number: string;
  totalCents: number;
  items: { name: string; size: string | null; quantity: number }[];
}) {
  const lines = input.items.map(
    (i) => `• ${i.quantity}× ${i.name}${i.size ? ` (${i.size})` : ""}`,
  );
  return `Olá! Acabei de fazer a encomenda ${input.number} no site:\n${lines.join("\n")}\nTotal: ${formatPrice(input.totalCents)}\nComo posso concluir o pagamento?`;
}
