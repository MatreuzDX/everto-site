import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const eur = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

export function formatPrice(cents: number): string {
  return eur.format(cents / 100);
}

/** "79,90" → 7990. Aceita vírgula ou ponto. Devolve null se inválido. */
export function parsePriceToCents(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.round(number * 100);
}

export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon",
  }).format(new Date(date));
}

export function orderNumber(seq: number): string {
  return `CI${String(seq).padStart(5, "0")}`;
}

/** "CI00012" → 12 */
export function parseOrderNumber(value: string): number | null {
  const match = /^CI(\d+)$/i.exec(value.trim());
  return match ? Number(match[1]) : null;
}

export function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function optionalStr(value: FormDataEntryValue | null): string | null {
  const s = str(value);
  return s === "" ? null : s;
}
