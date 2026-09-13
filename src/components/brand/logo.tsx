import { cn } from "@/lib/format";

/**
 * Logótipo provisório CAETANO IMPORTZ: selo de importação "CI" + marca
 * tipográfica. Substituível no admin (Definições → Logo) por um ficheiro real.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("h-9 w-9", className)}>
      <rect x="1.5" y="1.5" width="37" height="37" rx="3" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M8 13h24M8 27h24" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
      <text
        x="20"
        y="24.5"
        textAnchor="middle"
        fontFamily="var(--font-anton), Impact, sans-serif"
        fontSize="13"
        fill="currentColor"
        letterSpacing="0.5"
      >
        CI
      </text>
    </svg>
  );
}

export function Logo({
  className,
  logoUrl,
  name = "CAETANO IMPORTZ",
}: {
  className?: string;
  logoUrl?: string | null;
  name?: string;
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className={cn("h-9 w-auto", className)} />;
  }
  const [first, ...rest] = name.split(" ");
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="display text-[1.35rem]">{first}</span>
        {rest.length > 0 && <span className="tag mt-0.5 text-[0.62rem] tracking-[0.32em]">{rest.join(" ")}</span>}
      </span>
    </span>
  );
}
