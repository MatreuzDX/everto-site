import type { Metadata, Viewport } from "next";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@/components/analytics";
import { StoreProvider } from "@/components/store/store-provider";
import { getSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title =
    settings.seoTitle || `${settings.storeName} — Camisolas de futebol, streetwear e sneakers`;
  const description =
    settings.seoDescription ||
    "Camisolas de futebol, streetwear, sneakers e acessórios importados. Novos drops, stock por tamanho e compra pelo site ou WhatsApp.";
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${settings.storeName}` },
    description,
    applicationName: settings.storeName,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "pt_PT",
      siteName: settings.storeName,
      title,
      description,
      images: settings.heroImageUrl ? [{ url: settings.heroImageUrl }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
    verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT" className={`${anton.variable} ${inter.variable} ${jetbrains.variable} antialiased`}>
      <body className="min-h-dvh">
        <StoreProvider>{children}</StoreProvider>
        <Analytics />
      </body>
    </html>
  );
}
