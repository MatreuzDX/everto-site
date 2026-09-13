import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Uploads de imagens pelo admin: o browser reduz a foto antes de enviar,
    // mas uma foto grande pode passar de 1 MB. A Vercel aceita até 4,5 MB.
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    // Fotografias de produto vivem no Vercel Blob (produção) ou em
    // public/uploads (desenvolvimento). Nenhum outro domínio é otimizado.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
