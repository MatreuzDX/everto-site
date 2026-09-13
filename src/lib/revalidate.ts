import { revalidatePath } from "next/cache";

/** A loja é cacheada (ISR). Depois de o admin mudar catálogo ou definições, refresca tudo. */
export function revalidateStore() {
  revalidatePath("/", "layout");
  // Rotas de metadata não ficam abrangidas pelo layout.
  revalidatePath("/sitemap.xml");
}
