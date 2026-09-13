import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { LIVRO_RECLAMACOES_URL } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Contacto", alternates: { canonical: "/contacto" } };

export default async function ContactPage() {
  const s = await getSettings();
  const channels = [
    { label: "WhatsApp", value: s.whatsappNumber, href: whatsappLink(s.whatsappNumber, "Olá! Vim pelo site.") },
    { label: "Instagram", value: s.instagramUrl?.replace(/^https?:\/\/(www\.)?/, ""), href: s.instagramUrl },
    { label: "E-mail", value: s.email, href: s.email ? `mailto:${s.email}` : null },
    { label: "Telefone", value: s.phone, href: s.phone ? `tel:${s.phone.replace(/\s/g, "")}` : null },
    { label: "TikTok", value: s.tiktokUrl?.replace(/^https?:\/\/(www\.)?/, ""), href: s.tiktokUrl },
  ].filter((c) => c.value && c.href);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 pt-8 md:px-6 md:pt-12">
      <p className="tag text-muted">Fala connosco</p>
      <h1 className="display mt-2 text-6xl md:text-8xl">Contacto</h1>

      <ul className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
        {channels.map((c) => (
          <li key={c.label}>
            <a href={c.href!} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between gap-4 py-5">
              <span>
                <span className="tag block text-muted">{c.label}</span>
                <span className="display mt-1 block break-all text-3xl md:text-4xl">{c.value}</span>
              </span>
              <ArrowUpRight className="h-7 w-7 shrink-0 transition group-hover:-translate-y-1 group-hover:translate-x-1" />
            </a>
          </li>
        ))}
      </ul>

      {s.address && (
        <div className="mt-10">
          <p className="label">Morada</p>
          <p className="whitespace-pre-line">{s.address}</p>
        </div>
      )}

      <p className="mt-10 text-sm">
        <a href={LIVRO_RECLAMACOES_URL} target="_blank" rel="noopener noreferrer" className="underline">
          Livro de Reclamações Eletrónico
        </a>
      </p>
    </div>
  );
}
