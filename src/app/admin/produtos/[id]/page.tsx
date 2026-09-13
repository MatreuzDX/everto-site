import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { centsToInput } from "@/lib/format";
import { Notice, PageTitle } from "../../ui";
import { deleteProduct, duplicateProduct } from "../actions";
import { ProductForm } from "../product-form";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ guardado?: string; duplicado?: string }> };

export default async function EditProductPage({ params, searchParams }: Props) {
  await requireStaff();
  const [{ id }, { guardado, duplicado }] = await Promise.all([params, searchParams]);

  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        _count: { select: { orderItems: true } },
      },
    }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, parentId: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/produtos" className="text-sm underline">← Produtos</Link>
      {guardado && <Notice>Produto criado.</Notice>}
      {duplicado && <Notice tone="info">Cópia criada como rascunho, com stock a zero. Revê tamanhos, stock e SKU antes de publicar.</Notice>}
      <PageTitle
        title={product.name}
        description={product.status === "ACTIVE" ? `Publicado em /produto/${product.slug}` : "Não visível na loja"}
        actions={
          <>
            {product.status === "ACTIVE" && (
              <Link href={`/produto/${product.slug}`} target="_blank" className="btn btn-outline min-h-10">Ver ↗</Link>
            )}
            <form action={duplicateProduct}>
              <input type="hidden" name="id" value={product.id} />
              <button className="btn btn-outline min-h-10">Duplicar</button>
            </form>
          </>
        }
      />

      <ProductForm
        categories={categories}
        brands={brands}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          status: product.status,
          brandId: product.brandId ?? "",
          categoryId: product.categoryId ?? "",
          price: centsToInput(product.priceCents),
          salePrice: centsToInput(product.salePriceCents),
          sku: product.sku ?? "",
          videoUrl: product.videoUrl ?? "",
          isNew: product.isNew,
          isFeatured: product.isFeatured,
          isBestSeller: product.isBestSeller,
          isLimited: product.isLimited,
          lowStockThreshold: product.lowStockThreshold,
          origin: product.origin ?? "",
          model: product.model ?? "",
          collection: product.collection ?? "",
          edition: product.edition ?? "",
          importNotes: product.importNotes ?? "",
          authenticityNote: product.authenticityNote ?? "",
          authenticityConfirmed: product.authenticityConfirmed,
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
          images: product.images.map((i) => ({ url: i.url, alt: i.alt })),
          variants: product.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, sku: v.sku, stock: v.stock })),
        }}
      />

      <div className="mt-10 border border-danger/30 bg-white p-5">
        <p className="text-sm font-bold uppercase tracking-wide text-danger">Zona de perigo</p>
        <p className="mt-1 text-sm text-muted">
          {product._count.orderItems > 0
            ? "Este produto tem encomendas: ao apagar, é arquivado (sai da loja, o histórico mantém-se)."
            : "Apaga o produto e as imagens que só ele usa. Não dá para desfazer."}
        </p>
        <form action={deleteProduct} className="mt-3">
          <input type="hidden" name="id" value={product.id} />
          <button className="btn min-h-10 border border-danger text-danger hover:bg-danger hover:text-white">
            {product._count.orderItems > 0 ? "Arquivar produto" : "Apagar produto"}
          </button>
        </form>
      </div>
    </div>
  );
}
