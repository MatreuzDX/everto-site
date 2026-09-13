/** Árvore de categorias base. Usada pelo seed e pelo modo de demonstração. */

export type CategoryNode = { name: string; slug: string; home?: boolean; children?: CategoryNode[] };

export const BASE_CATEGORIES: CategoryNode[] = [
  {
    name: "Futebol",
    slug: "futebol",
    home: true,
    children: [
      { name: "Camisolas de clubes", slug: "camisolas-clubes" },
      { name: "Camisolas de seleções", slug: "camisolas-selecoes" },
      { name: "Retro", slug: "retro" },
      { name: "Chuteiras", slug: "chuteiras" },
    ],
  },
  {
    name: "Roupas",
    slug: "roupas",
    home: true,
    children: [
      { name: "T-shirts", slug: "t-shirts" },
      { name: "Oversized", slug: "oversized" },
      { name: "Hoodies", slug: "hoodies" },
      { name: "Sweatshirts", slug: "sweatshirts" },
      { name: "Calças", slug: "calcas" },
      { name: "Jeans", slug: "jeans" },
      { name: "Casacos", slug: "casacos" },
      { name: "Jaquetas", slug: "jaquetas" },
      { name: "Camisas", slug: "camisas" },
      { name: "Shorts", slug: "shorts" },
      { name: "Conjuntos", slug: "conjuntos" },
      { name: "Fatos de treino", slug: "fatos-de-treino" },
      { name: "Coletes", slug: "coletes" },
    ],
  },
  { name: "Sneakers", slug: "sneakers", home: true },
  { name: "Calçado", slug: "calcado", home: true },
  {
    name: "Acessórios",
    slug: "acessorios",
    home: true,
    children: [
      { name: "Bonés", slug: "bones" },
      { name: "Bolsas", slug: "bolsas" },
      { name: "Outros acessórios", slug: "outros-acessorios" },
    ],
  },
];
