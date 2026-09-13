import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "../auth-forms";

export const metadata: Metadata = { title: "Criar conta", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string }> }) {
  const { next, email } = await searchParams;
  if (await getCurrentUser()) redirect("/account");

  return (
    <div className="mx-auto max-w-md px-4 py-12 md:py-20">
      <p className="tag text-muted">Conta</p>
      <h1 className="display mt-2 text-6xl">Criar conta</h1>
      <p className="mt-3 text-muted">Segue as tuas encomendas, guarda moradas e favoritos.</p>
      <div className="mt-8">
        <RegisterForm next={next} email={email} />
      </div>
    </div>
  );
}
