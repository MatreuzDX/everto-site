import { CartDrawer } from "@/components/layout/cart-drawer";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { getSettings } from "@/lib/settings";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <Header />
      <main id="conteudo" className="min-h-[60vh]">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppFloat number={settings.whatsappNumber} />
    </>
  );
}
