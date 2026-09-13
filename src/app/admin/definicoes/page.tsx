import { requireAdmin } from "@/lib/auth";
import { COUNTRIES } from "@/lib/countries";
import { prisma } from "@/lib/db";
import { centsToInput } from "@/lib/format";
import { isMethodReady, PAYMENT_METHODS, type PaymentMethodId } from "@/lib/payments";
import { getSettings, trustItemsOf } from "@/lib/settings";
import { LEGAL_LINKS } from "@/lib/site";
import { Card, Notice, PageTitle } from "../ui";
import { deleteShippingMethod, saveLegalPage, saveSettings, saveShippingMethod } from "./actions";

function F({ label, name, defaultValue, type = "text", hint, placeholder }: { label: string; name: string; defaultValue?: string | null; type?: string; hint?: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="field" />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const MSG: Record<string, string> = {
  loja: "Definições guardadas.",
  envio: "Métodos de envio atualizados.",
  legal: "Página legal guardada.",
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireAdmin();
  const { ok, erro } = await searchParams;
  const [s, shipping, legal] = await Promise.all([
    getSettings(),
    prisma.shippingMethod.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.legalPage.findMany(),
  ]);
  const trust = trustItemsOf(s);
  const blobReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  return (
    <div>
      {ok && <Notice>{MSG[ok] ?? "Guardado."}</Notice>}
      {erro && <Notice tone="error">{erro === "envio" ? "Método de envio: nome, preço e pelo menos um país válido (ex.: PT)." : decodeURIComponent(erro)}</Notice>}
      <PageTitle title="Definições" description="Só dados reais da empresa. O que ficar vazio não aparece na loja." />

      <form action={saveSettings} className="grid gap-6 xl:grid-cols-2">
        <Card title="Loja">
          <div className="space-y-4">
            <F label="Nome da loja" name="storeName" defaultValue={s.storeName} />
            <F label="Slogan curto (acima do título do hero)" name="tagline" defaultValue={s.tagline} placeholder="Futebol · Streetwear · Sneakers" />
            <F label="Faixa de anúncio (topo)" name="announcement" defaultValue={s.announcement} hint="Ex.: uma promoção real. Vazio = palavras da marca." />
            <F label="Título do hero" name="heroTitle" defaultValue={s.heroTitle} />
            <F label="Subtítulo do hero" name="heroSubtitle" defaultValue={s.heroSubtitle} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="logo">Logótipo</label>
                <input id="logo" type="file" name="logo" accept="image/png,image/webp,image/jpeg" className="text-sm" />
                {s.logoUrl && <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" name="removeLogo" /> Remover logótipo atual</label>}
              </div>
              <div>
                <label className="label" htmlFor="heroImage">Imagem do hero</label>
                <input id="heroImage" type="file" name="heroImage" accept="image/png,image/webp,image/jpeg" className="text-sm" />
                {s.heroImageUrl && <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" name="removeHero" /> Remover imagem atual</label>}
              </div>
            </div>
            {!blobReady && <p className="text-xs text-amber-800">Uploads em produção precisam do Vercel Blob (BLOB_READ_WRITE_TOKEN).</p>}
          </div>
        </Card>

        <Card title="Contactos e redes sociais">
          <div className="space-y-4">
            <F label="WhatsApp (com indicativo)" name="whatsappNumber" defaultValue={s.whatsappNumber} placeholder="+351 9XX XXX XXX" hint="Ativa o botão flutuante e “Comprar pelo WhatsApp”." />
            <F label="E-mail" name="email" type="email" defaultValue={s.email} />
            <F label="Telefone" name="phone" defaultValue={s.phone} />
            <F label="Instagram (URL)" name="instagramUrl" type="url" defaultValue={s.instagramUrl} />
            <F label="TikTok (URL)" name="tiktokUrl" type="url" defaultValue={s.tiktokUrl} />
            <F label="Facebook (URL)" name="facebookUrl" type="url" defaultValue={s.facebookUrl} />
            <div>
              <label htmlFor="address" className="label">Morada</label>
              <textarea id="address" name="address" rows={2} defaultValue={s.address ?? ""} className="field" />
            </div>
          </div>
        </Card>

        <Card title="Dados legais">
          <div className="space-y-4">
            <F label="Nome legal / firma" name="legalName" defaultValue={s.legalName} />
            <F label="NIF" name="nif" defaultValue={s.nif} />
            <F label="Entidade RAL (resolução de litígios)" name="ralName" defaultValue={s.ralName} hint="Obrigatório para lojas online em Portugal. Confirmar a entidade competente para a zona da empresa." />
            <F label="Site da entidade RAL" name="ralUrl" type="url" defaultValue={s.ralUrl} />
          </div>
        </Card>

        <Card title="SEO e confiança">
          <div className="space-y-4">
            <F label="Título SEO da homepage" name="seoTitle" defaultValue={s.seoTitle} />
            <div>
              <label htmlFor="seoDescription" className="label">Descrição SEO</label>
              <textarea id="seoDescription" name="seoDescription" rows={2} maxLength={170} defaultValue={s.seoDescription ?? ""} className="field" />
            </div>
            <p className="label pt-2">Secção de confiança (só factos verdadeiros)</p>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr]">
                <input name={`trustTitle${i}`} defaultValue={trust[i]?.title} placeholder={["Pagamento seguro", "Envios", "Trocas", "Atendimento"][i]} className="field" aria-label={`Título ${i + 1}`} />
                <input name={`trustText${i}`} defaultValue={trust[i]?.text} placeholder="Texto curto e verdadeiro" className="field" aria-label={`Texto ${i + 1}`} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Pagamentos" className="xl:col-span-2">
          <p className="mb-4 text-sm text-muted">
            “Combinar pelo WhatsApp” está sempre ativo. Os restantes só aparecem ativos no checkout quando estiverem marcados aqui <b>e</b> as credenciais da ifthenpay existirem nas variáveis de ambiente (Fase 2).
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["MBWAY", "MULTIBANCO", "CARD"] as PaymentMethodId[]).map((m) => {
              const ready = isMethodReady(m);
              return (
                <label key={m} className="flex items-start gap-3 border border-ink/10 p-3 text-sm">
                  <input type="checkbox" name={`pm_${m}`} defaultChecked={s.paymentMethods.includes(m)} className="mt-0.5 h-5 w-5 accent-ink" />
                  <span>
                    <span className="block font-semibold">{PAYMENT_METHODS[m].label}</span>
                    <span className={`tag ${ready ? "text-emerald-700" : "text-amber-700"}`}>{ready ? "Pronto" : "Sem credenciais / por ativar"}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </Card>

        <div className="xl:col-span-2">
          <button className="btn btn-primary h-12 px-10">Guardar definições</button>
        </div>
      </form>

      <div id="envios" className="mt-10 scroll-mt-6">
        <Card title="Métodos de envio">
          <p className="mb-4 text-sm text-muted">
            Sem métodos, o checkout indica “envio a combinar”. Países: códigos separados por vírgula ({COUNTRIES.map((c) => c.code).join(", ")}).
          </p>
          <div className="space-y-3">
            {[...shipping, null].map((m) => (
              <form key={m?.id ?? "new"} action={saveShippingMethod} className={`grid items-end gap-2 border p-3 md:grid-cols-[1.4fr_0.6fr_0.8fr_0.7fr_1fr_auto_auto] ${m ? "border-ink/10" : "border-dashed border-ink/30"}`}>
                {m && <input type="hidden" name="id" value={m.id} />}
                <input name="name" defaultValue={m?.name} placeholder="Nome (ex.: CTT Expresso)" required className="field min-h-10 py-2" aria-label="Nome" />
                <input name="price" defaultValue={centsToInput(m?.priceCents)} placeholder="Preço €" required className="field min-h-10 py-2" aria-label="Preço" />
                <input name="countries" defaultValue={m?.countries.join(", ") ?? "PT"} placeholder="PT" className="field min-h-10 py-2" aria-label="Países" />
                <input name="freeOver" defaultValue={centsToInput(m?.freeOverCents)} placeholder="Grátis acima de €" className="field min-h-10 py-2" aria-label="Grátis acima de" />
                <input name="estimate" defaultValue={m?.estimate ?? ""} placeholder="Prazo (ex.: 1–3 dias úteis)" className="field min-h-10 py-2" aria-label="Prazo" />
                <label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={m?.isActive ?? true} className="h-4 w-4 accent-ink" /> Ativo</label>
                <button className="btn btn-primary min-h-10 px-4">{m ? "Guardar" : "Adicionar"}</button>
              </form>
            ))}
          </div>
          {shipping.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {shipping.map((m) => (
                <form key={m.id} action={deleteShippingMethod}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="text-xs text-danger underline">Apagar “{m.name}”</button>
                </form>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div id="legal" className="mt-10 scroll-mt-6 space-y-4">
        <h2 className="display text-3xl">Páginas legais</h2>
        <p className="text-sm text-muted">
          Conteúdo real revisto pela empresa (idealmente por um jurista). Texto simples: linha em branco separa parágrafos, “## ” cria um título, “- ” cria listas.
        </p>
        {LEGAL_LINKS.map((l) => {
          const page = legal.find((p) => p.slug === l.slug);
          return (
            <details key={l.slug} className="border border-ink/10 bg-white">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-semibold">
                {page?.title ?? l.label}
                <span className={`tag ${page?.content ? "text-emerald-700" : "text-amber-700"}`}>{page?.content ? "Preenchida" : "Vazia"}</span>
              </summary>
              <form action={saveLegalPage} className="space-y-3 border-t border-ink/10 p-4">
                <input type="hidden" name="slug" value={l.slug} />
                <input name="title" defaultValue={page?.title ?? l.label} className="field" aria-label="Título" />
                <textarea name="content" rows={14} defaultValue={page?.content ?? ""} className="field font-mono text-sm" aria-label="Conteúdo" />
                <button className="btn btn-primary min-h-10">Guardar página</button>
              </form>
            </details>
          );
        })}
      </div>
    </div>
  );
}
