import type { Prisma, ProductStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { Notice, PageTitle } from "../ui";

const STATUS_LABEL: Record<ProductStatus, string> = { DRAFT: "Rascunho", ACTIVE: "Publicado", ARCHIVED: "Arquivado" };

type Props = { searchParams: Promise<{ q?: string; estado?: string; apagado?: string; arquivado?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  await requireStaff();
  const { q, estado, apagado, arquivado } = await searchParams;

  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { variants: { some: { sku: { contains: q, mode: "insensitive" } } } }] } : {}),
    ...(estado && estado in STATUS_LABEL ? { status: estado as ProductStatus } : {}),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, select: { stock: true } },
      category: { select: { name: true } },
      brand: { select: { name: true } },
    },
  });

  return (
    <div>
      {apagado && <Notice>Produto apagado.</Notice>}
      {arquivado && <Notice tone="info">O produto tem encomendas, por isso foi arquivado em vez de apagado.</Notice>}
      <PageTitle
        title="Produtos"
        description={`${products.length} ${products.length === 1 ? "produto" : "produtos"}`}
        actions={<Link href="/admin/produtos/novo" className="btn btn-primary min-h-10">+ Novo produto</Link>}
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Nome ou SKU" className="field max-w-xs min-h-10 py-2" aria-label="Pesquisar" />
        <select name="estado" defaultValue={estado ?? ""} className="field w-auto min-h-10 py-2" aria-label="Estado">
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button className="btn btn-outline min-h-10">Filtrar</button>
      </form>

      {products.length === 0 ? (
        <div className="border-2 border-dashed border-ink/20 bg-white p-10 text-center">
          <p className="display text-3xl">Sem produtos</p>
          <p className="mt-2 text-sm text-muted">Cria o primeiro produto com fotos, tamanhos e stock reais.</p>
          <Link href="/admin/produtos/novo" className="btn btn-primary mt-5">Criar produto</Link>
        </div>
      ) : (
        <div className="overflow-x-auto border border-ink/10 bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-paper-2/60 text-left">
              <tr className="[&>th]:px-3 [&>th]:py-2.5 [&>th]:font-semibold">
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Stock</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {products.map((p) => {
                const stock = p.variants.reduce((s, v) => s + v.stock, 0);
                return (
                  <tr key={p.id} className="hover:bg-paper/50 [&>td]:px-3 [&>td]:py-2">
                    <td>
                      <Link href={`/admin/produtos/${p.id}`} className="flex items-center gap-3">
                        <span className="relative h-12 w-10 shrink-0 overflow-hidden bg-paper-2">
                          {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" />}
                        </span>
                        <span>
                          <span className="block font-semibold hover:underline">{p.name}</span>
                          {p.brand && <span className="text-xs text-muted">{p.brand.name}</span>}
                        </span>
                      </Link>
                    </td>
                    <td className="text-muted">{p.category?.name ?? "—"}</td>
                    <td className="tabular-nums">
                      {p.salePriceCents ? (
                        <>
                          <span className="font-semibold text-danger">{formatPrice(p.salePriceCents)}</span>{" "}
                          <s className="text-xs text-muted">{formatPrice(p.priceCents)}</s>
                        </>
                      ) : (
                        formatPrice(p.priceCents)
                      )}
                    </td>
                    <td>
                      <span className={`tag px-2 py-0.5 ${stock === 0 ? "bg-danger text-white" : stock <= p.lowStockThreshold ? "bg-amber-100" : "bg-paper-2"}`}>{stock}</span>
                    </td>
                    <td>
                      <span className={`tag px-2 py-0.5 ${p.status === "ACTIVE" ? "bg-lime" : "bg-paper-2"}`}>{STATUS_LABEL[p.status]}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
