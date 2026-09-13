import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { LoginForm } from "../auth-forms";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  // Só a página de login decide se a sessão é válida (evita ciclos com o proxy).
  if (user) redirect(next?.startsWith("/") && !next.startsWith("//") ? next : isStaff(user.role) ? "/admin" : "/account");

  return (
    <div className="mx-auto max-w-md px-4 py-12 md:py-20">
      <p className="tag text-muted">Conta</p>
      <h1 className="display mt-2 text-6xl">Entrar</h1>
      <div className="mt-8">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
