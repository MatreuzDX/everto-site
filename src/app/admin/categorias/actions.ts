"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { optionalStr, slugify, str } from "@/lib/format";
import { revalidateStore } from "@/lib/revalidate";
import { StorageError, uploadImage } from "@/lib/storage";

function back(query: string): never {
  redirect(`/admin/categorias?${query}`);
}

export async function saveCategory(formData: FormData) {
  await requireStaff();
  const id = optionalStr(formData.get("id"));
  const name = str(formData.get("name"));
  if (name.length < 2) back("erro=nome");
  const slug = slugify(str(formData.get("slug")) || name);
  const parentId = optionalStr(formData.get("parentId"));
  if (id && parentId === id) back("erro=pai");

  let imageUrl: string | undefined;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await uploadImage(file, "categorias");
    } catch (error) {
      back(`erro=${encodeURIComponent(error instanceof StorageError ? error.message : "upload")}`);
    }
  }

  const data = {
    name,
    slug,
    parentId,
    description: optionalStr(formData.get("description")),
    sortOrder: Number(formData.get("sortOrder")) || 0,
    isActive: formData.get("isActive") === "on",
    showOnHome: formData.get("showOnHome") === "on",
    seoTitle: optionalStr(formData.get("seoTitle")),
    seoDescription: optionalStr(formData.get("seoDescription")),
    ...(imageUrl ? { imageUrl } : {}),
    ...(formData.get("removeImage") === "on" && !imageUrl ? { imageUrl: null } : {}),
  };

  try {
    if (id) await prisma.category.update({ where: { id }, data });
    else await prisma.category.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") back("erro=slug");
    throw error;
  }
  revalidateStore();
  back("ok=1");
}

export async function deleteCategory(formData: FormData) {
  await requireStaff();
  const id = str(formData.get("id"));
  const [products, children] = await Promise.all([
    prisma.product.count({ where: { categoryId: id } }),
    prisma.category.count({ where: { parentId: id } }),
  ]);
  if (products > 0 || children > 0) back("erro=ocupada");
  await prisma.category.delete({ where: { id } });
  revalidateStore();
  back("ok=1");
}

export async function saveBrand(formData: FormData) {
  await requireStaff();
  const id = optionalStr(formData.get("id"));
  const name = str(formData.get("name"));
  if (name.length < 1) back("erro=nome");
  const data = { name, slug: slugify(str(formData.get("slug")) || name) };
  try {
    if (id) await prisma.brand.update({ where: { id }, data });
    else await prisma.brand.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") back("erro=slug");
    throw error;
  }
  revalidateStore();
  back("ok=1#marcas");
}

export async function deleteBrand(formData: FormData) {
  await requireStaff();
  const id = str(formData.get("id"));
  if ((await prisma.product.count({ where: { brandId: id } })) > 0) back("erro=marca-ocupada");
  await prisma.brand.delete({ where: { id } });
  revalidateStore();
  back("ok=1#marcas");
}
