/**
 * Catálogo de DEMONSTRAÇÃO (fotos gratuitas do Unsplash, nomes genéricos,
 * preços ilustrativos). Usado por:
 *   - prisma/demo.ts → grava estes produtos no banco (npm run demo:seed)
 *   - src/lib/demo-store.ts → mostra-os quando o site não tem banco ligado
 */

export const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;
const u = unsplash;
const CLOTHES = ["S", "M", "L", "XL", "XXL"];
const SHOES = ["38", "39", "40", "41", "42", "43", "44"];

export type DemoProductData = {
  name: string;
  category: string;
  price: number;
  sale?: number;
  images: string[];
  sizes: string[];
  stock: number[];
  flags?: Partial<Record<"isNew" | "isFeatured" | "isBestSeller" | "isLimited", boolean>>;
  text: string;
};

export const DEMO_PRODUCTS: DemoProductData[] = [
  // ─── Futebol ───

  // ─── Roupas ───
  { name: "T-shirt Oversized Branca Essential", category: "oversized", price: 24.9, images: [u("1581655353564-df123a1eb820"), u("1521572163474-6864f9cf17ab")], sizes: CLOTHES, stock: [10, 12, 9, 6, 3], flags: { isNew: true }, text: "Algodão pesado, corte oversized e ombro descaído. A base de qualquer fit." },
  { name: "T-shirt Preta Heavyweight", category: "t-shirts", price: 27.9, images: [u("1583743814966-8936f5b7be1a"), u("1618354691373-d851c5c3a990")], sizes: CLOTHES, stock: [8, 10, 10, 5, 2], flags: { isBestSeller: true }, text: "Preto profundo que não desbota. Gola reforçada." },
  { name: "Hoodie Cinza Classic", category: "hoodies", price: 59.9, images: [u("1556821840-3a63f95609a7"), u("1564557287817-3785e38ec1f5")], sizes: CLOTHES, stock: [4, 6, 5, 3, 1], text: "Felpa interior macia, capuz duplo e bolso canguru." },
  { name: "Hoodie Preto Urban", category: "hoodies", price: 64.9, sale: 49.9, images: [u("1579572331145-5e53b299c64e")], sizes: CLOTHES, stock: [0, 1, 2, 0, 0], flags: { isBestSeller: true }, text: "O hoodie que combina com tudo. Últimas unidades em promoção." },
  { name: "Hoodie Amarelo Statement", category: "hoodies", price: 59.9, images: [u("1609873814058-a8928924184a")], sizes: CLOTHES, stock: [2, 3, 2, 1, 0], flags: { isLimited: true, isNew: true }, text: "Cor para quem não passa despercebido." },
  { name: "Calça Cargo Castanha", category: "calcas", price: 54.9, images: [u("1511794322962-129ddbd0af38")], sizes: ["28", "30", "32", "34", "36"], stock: [3, 5, 6, 4, 2], flags: { isNew: true }, text: "Bolsos laterais, cordão no tornozelo e corte relaxado." },
  { name: "Casaco Puffer Branco", category: "casacos", price: 89.9, images: [u("1706765779494-2705542ebe74")], sizes: CLOTHES, stock: [1, 2, 2, 1, 0], flags: { isLimited: true }, text: "Volume, calor e presença. Stock muito limitado." },
  { name: "Jaqueta Street Laranja", category: "jaquetas", price: 79.9, images: [u("1578854955076-970394ef2512")], sizes: CLOTHES, stock: [2, 4, 3, 2, 1], text: "Corta-vento com cor vibrante e forro leve." },

  // ─── Sneakers e calçado ───
  { name: "Sneaker Pastel Low", category: "sneakers", price: 99.9, images: [u("1595950653106-6c9ebd614d3a")], sizes: SHOES, stock: [1, 2, 3, 3, 2, 1, 0], flags: { isNew: true, isFeatured: true }, text: "Tons pastel e sola robusta. O par que muda o outfit." },
  { name: "Sneaker Branco Minimal", category: "sneakers", price: 89.9, images: [u("1608231387042-66d1773070a5"), u("1600269452121-4f2416e55c28")], sizes: SHOES, stock: [3, 4, 5, 6, 5, 3, 2], flags: { isBestSeller: true }, text: "Branco limpo, perfurações laterais e conforto para o dia todo." },
  { name: "Sneaker Vermelho Runner", category: "sneakers", price: 94.9, sale: 79.9, images: [u("1542291026-7eec264c27ff")], sizes: SHOES, stock: [0, 1, 2, 2, 1, 0, 0], text: "Silhueta de corrida com amortecimento leve." },
  { name: "Sneaker High-Top Branco", category: "sneakers", price: 109.9, images: [u("1512374382149-233c42b6a83b")], sizes: SHOES, stock: [0, 0, 1, 1, 0, 1, 0], flags: { isLimited: true }, text: "Cano alto, pele sintética e atitude de basquetebol." },
  { name: "Ténis Canvas Bordeaux", category: "calcado", price: 49.9, images: [u("1525966222134-fcfa99b8ae77")], sizes: SHOES, stock: [2, 3, 4, 4, 3, 2, 1], text: "Lona resistente e sola vulcanizada. Clássico que nunca sai de moda." },

  // ─── Acessórios ───
  { name: "Boné Branco Clean", category: "bones", price: 22.9, images: [u("1588850561407-ed78c282e89b"), u("1691256676359-20e5c6d4bc92")], sizes: ["Único"], stock: [15], flags: { isNew: true }, text: "Seis painéis, fecho ajustável e aba curva." },
  { name: "Boné Cinza Washed", category: "bones", price: 22.9, images: [u("1521369909029-2afed882baee")], sizes: ["Único"], stock: [9], text: "Efeito lavado vintage." },
  { name: "Boné Amarelo Drop", category: "bones", price: 24.9, images: [u("1645266729222-17cd32e06fd0")], sizes: ["Único"], stock: [2], flags: { isLimited: true }, text: "Cor do drop. Poucas unidades." },
  { name: "Bolsa Sling Preta", category: "bolsas", price: 34.9, images: [u("1620786514684-ff35b5aae55e"), u("1620786514669-06e2340fce71")], sizes: ["Único"], stock: [7], flags: { isBestSeller: true }, text: "Compacta, tiracolo ajustável e bolso interior para o essencial." },
];

export const DEMO_CATEGORY_IMAGES: Record<string, string> = {
  roupas: u("1623596305214-19f21cbf48ee"),
  sneakers: u("1600185365926-3a2ce3cdb9eb"),
  calcado: u("1549298916-b41d501d3772"),
  acessorios: u("1653704841996-c2ed854aedd8"),
};

export const DEMO_HERO = u("1523398002811-999ca8dec234");

export function demoSlug(name: string) {
  return `demo-${name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}
