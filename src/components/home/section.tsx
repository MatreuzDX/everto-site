import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function SectionHeader({
  eyebrow,
  title,
  href,
  linkLabel = "Ver tudo",
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
      <div>
        {eyebrow && <p className={`tag mb-2 ${dark ? "text-brand" : "text-muted"}`}>{eyebrow}</p>}
        <h2 className="display text-[2.6rem] md:text-6xl">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className={`group flex shrink-0 items-center gap-1 border-b pb-0.5 text-sm font-semibold uppercase tracking-wide ${dark ? "border-paper/40" : "border-ink/40"}`}
        >
          {linkLabel}
          <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
