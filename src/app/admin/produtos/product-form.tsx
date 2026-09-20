"use client";

import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { SIZE_PRESETS } from "@/lib/catalog-shared";
import { saveProduct, uploadProductImage, type ProductFormState } from "./actions";

type Variant = { id?: string; size: string | null; color: string | null; sku: string | null; stock: number; key: string };
type Img = { url: string; alt: string | null };

export type ProductFormValues = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  brandId: string;
  categoryId: string;
  price: string;
  salePrice: string;
  sku: string;
  videoUrl: string;
  isNew: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isLimited: boolean;
  lowStockThreshold: number;
  origin: string;
  model: string;
  collection: string;
  edition: string;
  importNotes: string;
  authenticityNote: string;
  authenticityConfirmed: boolean;
  seoTitle: string;
  seoDescription: string;
  images: Img[];
  variants: Omit<Variant, "key">[];
};

let keySeq = 0;
const newKey = () => `v${++keySeq}`;

/** Reduz a foto no browser (máx. 2000 px, WebP) — uploads rápidos e leves. */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/avif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

function Input({ label, name, hint, ...props }: { label: string; name: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} name={name} className="field" {...props} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-ink/10 bg-white p-5">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function ProductForm({
  product,
  categories,
  brands,
}: {
  product?: ProductFormValues;
  categories: { id: string; name: string; parentId: string | null }[];
  brands: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, null);
  const [images, setImages] = useState<Img[]>(product?.images ?? []);
  const [variants, setVariants] = useState<Variant[]>(
    (product?.variants ?? []).map((v) => ({ ...v, key: newKey() })),
  );
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [color, setColor] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadError(null);
    const list = Array.from(files).slice(0, 20 - images.length);
    setUploading((n) => n + list.length);
    for (const file of list) {
      const fd = new FormData();
      fd.set("file", await shrink(file));
      const result = await uploadProductImage(fd);
      if (result.url) setImages((imgs) => [...imgs, { url: result.url!, alt: null }]);
      else setUploadError(result.error ?? "Falha no upload.");
      setUploading((n) => n - 1);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function move<T>(list: T[], from: number, to: number) {
    const copy = [...list];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  }

  function addPreset(sizes: string[]) {
    setVariants((current) => {
      const c = color.trim() || null;
      const exists = new Set(current.map((v) => `${v.size}|${v.color ?? ""}`));
      const added = sizes
        .filter((s) => !exists.has(`${s}|${c ?? ""}`))
        .map((s) => ({ size: s, color: c, sku: null, stock: 0, key: newKey() }));
      return [...current, ...added];
    });
  }

  const roots = categories.filter((c) => !c.parentId);
  const totalStock = variants.reduce((s, v) => s + (Number.isFinite(v.stock) ? v.stock : 0), 0);

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="variants" value={JSON.stringify(variants.map(({ key: _k, ...v }) => v))} />

      <div className="space-y-6">
        <Section title="Informação">
          <Input label="Nome" name="name" defaultValue={product?.name} required maxLength={160} />
          <Input label="Slug (URL)" name="slug" defaultValue={product?.slug} hint="Deixa vazio para gerar a partir do nome." maxLength={80} />
          <div>
            <label htmlFor="description" className="label">Descrição</label>
            <textarea id="description" name="description" rows={6} defaultValue={product?.description} className="field" />
          </div>
        </Section>

        <Section title={`Imagens (${images.length}/20)`}>
          {images.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((img, i) => (
                <li key={img.url} className="border border-ink/10">
                  <div className="relative aspect-[4/5] bg-paper-2">
                    <Image src={img.url} alt="" fill sizes="200px" className="object-cover" />
                    {i === 0 && <span className="tag absolute left-1 top-1 bg-brand px-1.5 py-0.5">Principal</span>}
                  </div>
                  <input
                    value={img.alt ?? ""}
                    onChange={(e) => setImages((imgs) => imgs.map((x, j) => (j === i ? { ...x, alt: e.target.value || null } : x)))}
                    placeholder="Texto alternativo"
                    className="w-full border-t border-ink/10 px-2 py-1.5 text-xs"
                    aria-label={`Texto alternativo da imagem ${i + 1}`}
                  />
                  <div className="flex border-t border-ink/10">
                    <button type="button" disabled={i === 0} onClick={() => setImages((imgs) => move(imgs, i, i - 1))} className="grid h-9 flex-1 place-items-center disabled:opacity-30" aria-label="Mover para a esquerda"><ArrowUp className="h-4 w-4 -rotate-90" /></button>
                    <button type="button" disabled={i === images.length - 1} onClick={() => setImages((imgs) => move(imgs, i, i + 1))} className="grid h-9 flex-1 place-items-center disabled:opacity-30" aria-label="Mover para a direita"><ArrowDown className="h-4 w-4 -rotate-90" /></button>
                    <button type="button" onClick={() => setImages((imgs) => imgs.filter((_, j) => j !== i))} className="grid h-9 flex-1 place-items-center text-danger" aria-label="Remover imagem"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-ink/20 p-6 text-sm hover:border-ink">
            {uploading > 0 ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
            {uploading > 0 ? `A enviar ${uploading}…` : "Adicionar fotos (JPG, PNG, WebP)"}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
          </label>
          {uploadError && <p className="text-sm font-semibold text-danger">{uploadError}</p>}
          <Input label="Vídeo (URL, opcional)" name="videoUrl" type="url" defaultValue={product?.videoUrl} />
        </Section>

        <Section title={`Variantes e stock (${totalStock} un.)`}>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="preset-color" className="label">Cor (opcional)</label>
              <input id="preset-color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="ex.: Preto" className="field min-h-10 w-36 py-2" />
            </div>
            {SIZE_PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => addPreset(p.sizes)} className="btn btn-outline min-h-10 px-3 text-xs">
                + {p.label}
              </button>
            ))}
          </div>

          {variants.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs uppercase text-muted">
                  <tr className="[&>th]:pb-2 [&>th]:pr-2">
                    <th>Tamanho</th>
                    <th>Cor</th>
                    <th>SKU</th>
                    <th>Stock</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, i) => (
                    <tr key={v.key} className="[&>td]:py-1 [&>td]:pr-2">
                      {(["size", "color", "sku"] as const).map((field) => (
                        <td key={field}>
                          <input
                            value={v[field] ?? ""}
                            onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, [field]: e.target.value || null } : x)))}
                            className="field min-h-10 py-2"
                            aria-label={`${field} da variante ${i + 1}`}
                          />
                        </td>
                      ))}
                      <td className="w-28">
                        <input
                          type="number"
                          min={0}
                          value={Number.isFinite(v.stock) ? v.stock : ""}
                          onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, stock: Math.max(0, Math.floor(Number(e.target.value))) } : x)))}
                          className={`field min-h-10 py-2 ${v.stock === 0 ? "text-danger" : ""}`}
                          aria-label={`Stock da variante ${i + 1}`}
                        />
                      </td>
                      <td className="w-10">
                        <button type="button" onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))} className="grid h-10 w-10 place-items-center text-danger" aria-label="Remover variante">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button type="button" onClick={() => setVariants((vs) => [...vs, { size: null, color: color || null, sku: null, stock: 0, key: newKey() }])} className="flex items-center gap-1 text-sm font-semibold underline">
            <Plus className="h-4 w-4" /> Variante manual
          </button>
          <Input label="Alerta de stock baixo (unidades)" name="lowStockThreshold" type="number" min={0} max={100} defaultValue={product?.lowStockThreshold ?? 2} />
        </Section>

        <Section title="Produto importado">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Origem" name="origin" defaultValue={product?.origin} />
            <Input label="Modelo" name="model" defaultValue={product?.model} />
            <Input label="Coleção" name="collection" defaultValue={product?.collection} />
            <Input label="Edição" name="edition" defaultValue={product?.edition} />
          </div>
          <div>
            <label htmlFor="importNotes" className="label">Observações</label>
            <textarea id="importNotes" name="importNotes" rows={3} defaultValue={product?.importNotes} className="field" />
          </div>
          <div className="border border-amber-300 bg-amber-50 p-4">
            <label htmlFor="authenticityNote" className="label">Autenticidade</label>
            <textarea id="authenticityNote" name="authenticityNote" rows={2} defaultValue={product?.authenticityNote} className="field" />
            <label className="mt-3 flex items-start gap-3 text-sm">
              <input type="checkbox" name="authenticityConfirmed" defaultChecked={product?.authenticityConfirmed} className="mt-0.5 h-5 w-5 shrink-0 accent-ink" />
              <span>
                Confirmo que tenho prova (ex.: fatura de fornecedor autorizado) do que está escrito acima. Só com esta caixa marcada o texto aparece na loja.
                Nunca escrever “original”, “oficial” ou “100% genuíno” sem essa prova.
              </span>
            </label>
          </div>
        </Section>

        <Section title="SEO">
          <Input label="Título SEO" name="seoTitle" defaultValue={product?.seoTitle} maxLength={70} hint="Até ~60 caracteres. Vazio = nome do produto." />
          <div>
            <label htmlFor="seoDescription" className="label">Descrição SEO</label>
            <textarea id="seoDescription" name="seoDescription" rows={2} maxLength={170} defaultValue={product?.seoDescription} className="field" />
          </div>
        </Section>
      </div>

      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Section title="Publicação">
          <div>
            <label htmlFor="status" className="label">Estado</label>
            <select id="status" name="status" defaultValue={product?.status ?? "DRAFT"} className="field">
              <option value="DRAFT">Rascunho (escondido)</option>
              <option value="ACTIVE">Publicado</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>
          </div>
          {state?.message && (
            <p role="status" className={`p-3 text-sm font-semibold ${state.ok ? "bg-emerald-100 text-emerald-900" : "bg-danger/10 text-danger"}`}>{state.message}</p>
          )}
          <button type="submit" disabled={pending || uploading > 0} className="btn btn-primary h-12 w-full">
            {pending ? "A guardar…" : "Guardar produto"}
          </button>
        </Section>

        <Section title="Preço">
          <Input label="Preço (€)" name="price" inputMode="decimal" placeholder="79,90" defaultValue={product?.price} required />
          <Input label="Preço promocional (€)" name="salePrice" inputMode="decimal" defaultValue={product?.salePrice} hint="Vazio = sem promoção." />
          <Input label="SKU do produto" name="sku" defaultValue={product?.sku} />
        </Section>

        <Section title="Organização">
          <div>
            <label htmlFor="categoryId" className="label">Categoria</label>
            <select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""} className="field">
              <option value="">Sem categoria</option>
              {roots.map((root) => (
                <optgroup key={root.id} label={root.name}>
                  <option value={root.id}>{root.name}</option>
                  {categories.filter((c) => c.parentId === root.id).map((c) => (
                    <option key={c.id} value={c.id}>— {c.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="brandId" className="label">Marca</label>
            <select id="brandId" name="brandId" defaultValue={product?.brandId ?? ""} className="field">
              <option value="">Sem marca</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">Marcas criam-se em Categorias e marcas.</p>
          </div>
          <div className="grid gap-2 text-sm">
            {[
              ["isNew", "Novidade (badge NOVO)", product?.isNew],
              ["isFeatured", "Em destaque", product?.isFeatured],
              ["isBestSeller", "Mais vendido", product?.isBestSeller],
              ["isLimited", "Limitado / exclusivo", product?.isLimited],
            ].map(([name, label, checked]) => (
              <label key={name as string} className="flex items-center gap-3">
                <input type="checkbox" name={name as string} defaultChecked={Boolean(checked)} className="h-5 w-5 accent-ink" />
                {label as string}
              </label>
            ))}
          </div>
        </Section>
      </div>
    </form>
  );
}
