/** Utilitários de catálogo sem acesso ao banco — podem ser usados no browser. */

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL"];

/** Ordena tamanhos: 36 < 37 < 42,5; XS < S < M < L < XL; resto por ordem alfabética. */
export function compareSizes(a: string, b: string) {
  const na = Number(a.replace(",", "."));
  const nb = Number(b.replace(",", "."));
  if (a !== "" && b !== "" && !Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  const ia = SIZE_ORDER.indexOf(a.toUpperCase());
  const ib = SIZE_ORDER.indexOf(b.toUpperCase());
  if (ia !== -1 && ib !== -1) return ia - ib;
  return a.localeCompare(b, "pt");
}

export const SIZE_PRESETS = [
  { label: "Roupa (XS–XXL)", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  { label: "Calçado (36–45)", sizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"] },
  { label: "Criança (2–14 anos)", sizes: ["2A", "4A", "6A", "8A", "10A", "12A", "14A"] },
  { label: "Tamanho único", sizes: ["Único"] },
];
