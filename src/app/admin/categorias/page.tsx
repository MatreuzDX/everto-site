import type { Category } from "@prisma/client";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Notice, PageTitle } from "../ui";
import { deleteBrand, deleteCategory, saveBrand, saveCategory } from "./actions";

const ERRORS: Record<string, string> = {
  nome: "O nome é obrigatório.",
  slug: "Já existe outro item com esse slug.",
  pai: "Uma categoria não pode ser mãe de si própria.",
  ocupada: "Só dá para apagar categorias sem produtos nem subcategorias.",
  "marca-ocupada": "Só dá para apagar marcas sem produtos.",
  upload: "Falha no upload da imagem.",
};

function CategoryFields({ category, roots }: { category?: Category; roots: Category[] }) {
  return (
    <>
      {category && <input type="hidden" name="id" value={category.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" defaultValue={category?.name} placeholder="Nome" required className="field" aria-label="Nome" />
        <input name="slug" defaultValue={category?.slug} placeholder="slug (automático)" className="field" aria-label="Slug" />
        <select name="parentId" defaultValue={category?.parentId ?? ""} className="field" aria-label="Categoria mãe">
          <option value="">— Categoria principal —</option>
          {roots.filter((r) => r.id !== category?.id).map((r) => (
            <option key={r.id} value={r.id}>Dentro de: {r.name}</option>
          ))}
        </select>
        <input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} className="field" aria-label="Ordem" />
      </div>
      <textarea name="description" defaultValue={category?.description ?? ""} rows={2} placeholder="Descrição (aparece na página e ajuda o SEO)" className="field" aria-label="Descrição" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="seoTitle" defaultValue={category?.seoTitle ?? ""} placeholder="Título SEO" className="field" aria-label="Título SEO" />
        <input name="seoDescription" defaultValue={category?.seoDescription ?? ""} placeholder="Descrição SEO" className="field" aria-label="Descrição SEO" />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={category?.isActive ?? true} className="h-4 w-4 accent-ink" /> Ativa</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="showOnHome" defaultChecked={category?.showOnHome ?? false} className="h-4 w-4 accent-ink" /> Mostrar na homepage</label>
        <label className="flex items-center gap-2">Imagem <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="text-xs" /></label>
        {category?.imageUrl && (
          <label className="flex items-center gap-2"><input type="checkbox" name="removeImage" className="h-4 w-4 accent-ink" /> Remover imagem</label>
        )}
      </div>
    </>
  );
}

type Props = { searchParams: Promise<{ ok?: string; erro?: string }> };

export default async function CategoriesPage({ searchParams }: Props) {
  await requireStaff();
  const { ok, erro } = await searchParams;
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } }),
  ]);
  const roots = categories.filter((c) => !c.parentId);

  return (
    <div>
      {ok && <Notice>Guardado.</Notice>}
      {erro && <Notice tone="error">{ERRORS[erro] ?? decodeURIComponent(erro)}</Notice>}
      <PageTitle title="Categorias e marcas" />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card title="Nova categoria">
            <form action={saveCategory} className="space-y-3">
              <CategoryFields roots={roots} />
              <button className="btn btn-primary min-h-10">Criar categoria</button>
            </form>
          </Card>

          <Card title={`Categorias (${categories.length})`}>
            <ul className="divide-y divide-ink/10">
              {roots.flatMap((root) => [root, ...categories.filter((c) => c.parentId === root.id)]).map((c) => (
                <li key={c.id} className={c.parentId ? "pl-6" : ""}>
                  <details className="group py-2">
                    <summary className="flex cursor-pointer list-none items-center gap-3">
                      <span className={`font-medium ${c.parentId ? "" : "font-bold uppercase"}`}>{c.name}</span>
                      <span className="tag text-muted">/{c.slug}</span>
                      {!c.isActive && <span className="tag bg-paper-2 px-1.5">Inativa</span>}
                      {c.showOnHome && <span className="tag bg-brand px-1.5">Home</span>}
                      <span className="ml-auto text-xs text-muted">{c._count.products} produtos</span>
                      <span className="text-muted transition group-open:rotate-45">+</span>
                    </summary>
                    <div className="mt-3 space-y-3 bg-paper/60 p-3">
                      <form action={saveCategory} className="space-y-3">
                        <CategoryFields category={c} roots={roots} />
                        <button className="btn btn-primary min-h-10">Guardar</button>
                      </form>
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="text-sm text-danger underline">Apagar categoria</button>
                      </form>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card title="Marcas" className="h-fit">
          <div id="marcas" />
          <form action={saveBrand} className="flex gap-2">
            <input name="name" placeholder="Nova marca" required className="field min-h-10 py-2" aria-label="Nova marca" />
            <button className="btn btn-primary min-h-10">Criar</button>
          </form>
          {brands.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Sem marcas. Cria só marcas reais dos produtos que vendes.</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10">
              {brands.map((b) => (
                <li key={b.id} className="flex items-center gap-2 py-2">
                  <form action={saveBrand} className="flex flex-1 gap-2">
                    <input type="hidden" name="id" value={b.id} />
                    <input name="name" defaultValue={b.name} className="field min-h-9 py-1" aria-label={`Nome da marca ${b.name}`} />
                    <button className="text-xs font-semibold underline">Guardar</button>
                  </form>
                  <span className="text-xs text-muted">{b._count.products}</span>
                  {b._count.products === 0 && (
                    <form action={deleteBrand}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="text-xs text-danger underline">Apagar</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
