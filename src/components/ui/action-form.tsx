"use client";

import { useActionState, type ReactNode } from "react";

type State = { ok: boolean; message: string } | null;

/** Formulário com Server Action que mostra a mensagem devolvida e o estado a enviar. */
export function ActionForm({
  action,
  children,
  submitLabel,
  className = "space-y-4",
  resetOnSuccess = false,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  children: ReactNode;
  submitLabel: string;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    // React 19 limpa os campos não controlados depois de uma action bem-sucedida;
    // sem `resetOnSuccess` repomos os valores guardados via defaultValue do servidor.
    <form action={formAction} className={className} data-reset={resetOnSuccess || undefined}>
      {children}
      {state?.message && (
        <p role="status" className={`p-3 text-sm font-semibold ${state.ok ? "bg-emerald-100 text-emerald-900" : "bg-danger/10 text-danger"}`}>
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "A guardar…" : submitLabel}
      </button>
    </form>
  );
}
