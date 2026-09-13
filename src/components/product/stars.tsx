import { cn } from "@/lib/format";

export function Stars({ value, count, className }: { value: number; count?: number; className?: string }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cn("flex items-center gap-1 text-xs", className)} aria-label={`${value.toFixed(1)} de 5 estrelas`}>
      <span className="relative inline-block leading-none tracking-[0.1em] text-ink/20" aria-hidden>
        ★★★★★
        <span className="absolute inset-0 overflow-hidden text-ink" style={{ width: `${(rounded / 5) * 100}%` }}>
          ★★★★★
        </span>
      </span>
      {count != null && <span className="text-muted">({count})</span>}
    </span>
  );
}
