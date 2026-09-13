export const COUNTRIES = [
  { code: "PT", name: "Portugal" },
  { code: "ES", name: "Espanha" },
  { code: "FR", name: "França" },
  { code: "DE", name: "Alemanha" },
  { code: "IT", name: "Itália" },
  { code: "NL", name: "Países Baixos" },
  { code: "BE", name: "Bélgica" },
  { code: "LU", name: "Luxemburgo" },
  { code: "IE", name: "Irlanda" },
  { code: "AT", name: "Áustria" },
  { code: "CH", name: "Suíça" },
  { code: "GB", name: "Reino Unido" },
  { code: "BR", name: "Brasil" },
] as const;

export const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as string[];

export function countryName(code: string) {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
