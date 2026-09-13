"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CatalogParams } from "@/lib/catalog";

type Props = {
  basePath: string;
  params: CatalogParams;
  lockCategory?: boolean;
  categories: { id: string; slug: string; name: string; parentId: string | null }[];
  brands: { slug: string; name: string }[];
  sizes: string[];
  colors: string[];
  sortOptions: { value: string; label: string }[];
};

export function Filters({ basePath, params, lockCategory, categories, brands, sizes, colors, sortOptions }: Props) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function apply(form: HTMLFormElement) {
    const data = new FormData(form);
    const search = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (typeof value === "string" && value.trim() !== "") search.set(key, value.trim());
    }
    const qs = search.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }

  const roots = categories.filter((c) => !c.parentId);

  return (
    <form
      ref={formRef}
      action={basePath}
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        setOpen(false);
        apply(e.currentTarget);
      }}
      className="contents"
    >
      {params.q && <input type="hidden" name="q" value={params.q} />}

      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary min-h-10 px-4">
        <SlidersHorizontal className="h-4 w-4" /> Filtros
      </button>

      <label className="sr-only" htmlFor="ordem">
        Ordenar
      </label>
      <select
        id="ordem"
        name="ordem"
        defaultValue={params.ordem ?? "relevancia"}
        onChange={(e) => apply(e.currentTarget.form!)}
        className="h-10 border border-ink/20 bg-transparent px-2 text-sm font-semibold"
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value === "relevancia" ? "" : o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <div className={open ? "fixed inset-0 z-[60]" : "hidden"}>
        <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
        <div className="animate-fade-up absolute inset-y-0 left-0 flex w-full max-w-md flex-col bg-paper">
          <div className="flex h-16 items-center justify-between border-b border-ink/10 px-5">
            <p className="display text-3xl">Filtros</p>
            <button type="button" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center" aria-label="Fechar filtros">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
            {!lockCategory && roots.length > 0 && (
              <fieldset>
                <legend className="label">Categoria</legend>
                <select name="categoria" defaultValue={params.categoria ?? ""} className="field">
                  <option value="">Todas</option>
                  {roots.map((root) => (
                    <optgroup key={root.id} label={root.name}>
                      <option value={root.slug}>Tudo em {root.name}</option>
                      {categories
                        .filter((c) => c.parentId === root.id)
                        .map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </fieldset>
            )}

            {brands.length > 0 && (
              <fieldset>
                <legend className="label">Marca</legend>
                <select name="marca" defaultValue={params.marca ?? ""} className="field">
                  <option value="">Todas</option>
                  {brands.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </fieldset>
            )}

            {sizes.length > 0 && (
              <fieldset>
                <legend className="label">Tamanho</legend>
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer">
                    <input type="radio" name="tamanho" value="" defaultChecked={!params.tamanho} className="peer sr-only" />
                    <span className="tag grid h-10 min-w-12 place-items-center border border-ink/20 px-3 peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:ring-2">
                      Todos
                    </span>
                  </label>
                  {sizes.map((s) => (
                    <label key={s} className="cursor-pointer">
                      <input type="radio" name="tamanho" value={s} defaultChecked={params.tamanho === s} className="peer sr-only" />
                      <span className="tag grid h-10 min-w-12 place-items-center border border-ink/20 px-3 peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:ring-2">
                        {s}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {colors.length > 0 && (
              <fieldset>
                <legend className="label">Cor</legend>
                <select name="cor" defaultValue={params.cor ?? ""} className="field">
                  <option value="">Todas</option>
                  {colors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </fieldset>
            )}

            <fieldset>
              <legend className="label">Preço (€)</legend>
              <div className="flex items-center gap-2">
                <input name="min" inputMode="numeric" placeholder="Mín." defaultValue={params.min} className="field" aria-label="Preço mínimo" />
                <span>—</span>
                <input name="max" inputMode="numeric" placeholder="Máx." defaultValue={params.max} className="field" aria-label="Preço máximo" />
              </div>
            </fieldset>

            <fieldset className="grid gap-3">
              <legend className="label">Mostrar só</legend>
              {[
                ["disponivel", "Em stock"],
                ["novidade", "Novidades"],
                ["promo", "Em promoção"],
                ["exclusivo", "Exclusivos / limitados"],
              ].map(([name, label]) => (
                <label key={name} className="flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    name={name}
                    value="1"
                    defaultChecked={Boolean(params[name as keyof CatalogParams])}
                    className="h-5 w-5 accent-ink"
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-ink/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setOpen(false);
                router.push(basePath, { scroll: false });
              }}
            >
              Limpar
            </button>
            <button type="submit" className="btn btn-primary">
              Ver resultados
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
