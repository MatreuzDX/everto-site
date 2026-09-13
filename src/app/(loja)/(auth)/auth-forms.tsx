"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MIN_PASSWORD_LENGTH_CLIENT } from "./constants";
import { loginAction, registerAction, type AuthState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, null);
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="email" className="label">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">Palavra-passe</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      {state?.error && <p role="alert" className="bg-danger/10 p-3 text-sm font-semibold text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary h-14 w-full">
        {pending ? "A entrar…" : "Entrar"}
      </button>
      <p className="text-center text-sm">
        Ainda não tens conta?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next, email }: { next?: string; email?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(registerAction, null);
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="name" className="label">Nome</label>
        <input id="name" name="name" autoComplete="name" required className="field" />
      </div>
      <div>
        <label htmlFor="email" className="label">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" defaultValue={email} required className="field" />
      </div>
      <div>
        <label htmlFor="phone" className="label">Telemóvel (opcional)</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">Palavra-passe</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH_CLIENT} required className="field" />
        <p className="mt-1 text-xs text-muted">Mínimo {MIN_PASSWORD_LENGTH_CLIENT} caracteres.</p>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="acceptTerms" required className="mt-0.5 h-5 w-5 shrink-0 accent-ink" />
        <span>
          Aceito os <Link href="/legal/termos" target="_blank" className="underline">termos</Link> e a{" "}
          <Link href="/legal/privacidade" target="_blank" className="underline">política de privacidade</Link>.
        </span>
      </label>
      {state?.error && <p role="alert" className="bg-danger/10 p-3 text-sm font-semibold text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary h-14 w-full">
        {pending ? "A criar…" : "Criar conta"}
      </button>
      <p className="text-center text-sm">
        Já tens conta?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
