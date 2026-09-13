import type { ReactNode } from "react";

export function PageTitle({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-4xl md:text-5xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`border border-ink/10 bg-white p-5 ${className}`}>
      {title && <h2 className="mb-4 text-sm font-bold uppercase tracking-wide">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="border border-ink/10 bg-white p-4">
      <p className="tag text-muted">{label}</p>
      <p className="display mt-2 text-3xl tabular-nums md:text-4xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Notice({ tone = "ok", children }: { tone?: "ok" | "error" | "info"; children: ReactNode }) {
  const tones = { ok: "bg-emerald-100 text-emerald-900", error: "bg-danger/10 text-danger", info: "bg-sky-100 text-sky-900" };
  return <p className={`mb-4 p-3 text-sm font-semibold ${tones[tone]}`}>{children}</p>;
}
