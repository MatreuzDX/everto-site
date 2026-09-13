import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle } from "../../ui";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  await requireStaff();
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, parentId: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <div>
      <Link href="/admin/produtos" className="text-sm underline">← Produtos</Link>
      <PageTitle title="Novo produto" />
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
