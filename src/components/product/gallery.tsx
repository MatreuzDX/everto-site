"use client";

import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Img = { url: string; alt: string | null };

export function Gallery({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoomAt, setZoomAt] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  useEffect(() => {
    if (zoomAt === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomAt(null);
      if (e.key === "ArrowRight") setZoomAt((z) => (z === null ? z : (z + 1) % images.length));
      if (e.key === "ArrowLeft") setZoomAt((z) => (z === null ? z : (z - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoomAt, images.length]);

  if (images.length === 0) {
    return (
      <div className="grid aspect-[4/5] place-items-center bg-paper-2">
        <span className="display text-8xl text-ink/10">CI</span>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: deslizar com o dedo, como nas grandes lojas de moda */}
      <div className="relative -mx-4 md:hidden">
        <div ref={trackRef} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
          {images.map((img, i) => (
            <button
              type="button"
              key={img.url}
              onClick={() => setZoomAt(i)}
              className="relative aspect-[4/5] w-full shrink-0 snap-center bg-paper-2"
              aria-label={`Ampliar imagem ${i + 1}`}
            >
              <Image src={img.url} alt={img.alt || `${name} — imagem ${i + 1}`} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-paper/80 px-2.5 py-1.5">
            {images.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-ink" : "w-1.5 bg-ink/30"}`} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: grelha editorial */}
      <div className="hidden gap-2 md:grid md:grid-cols-2">
        {images.map((img, i) => (
          <button
            type="button"
            key={img.url}
            onClick={() => setZoomAt(i)}
            className={`group relative aspect-[4/5] cursor-zoom-in overflow-hidden bg-paper-2 ${i === 0 && images.length % 2 === 1 ? "col-span-2" : ""}`}
            aria-label={`Ampliar imagem ${i + 1}`}
          >
            <Image
              src={img.url}
              alt={img.alt || `${name} — imagem ${i + 1}`}
              fill
              priority={i === 0}
              sizes="(min-width: 1280px) 34vw, 45vw"
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
            />
            <ZoomIn className="absolute right-3 top-3 h-5 w-5 opacity-0 transition group-hover:opacity-100" aria-hidden />
          </button>
        ))}
      </div>

      {zoomAt !== null && (
        <div className="fixed inset-0 z-[80] bg-ink" role="dialog" aria-modal="true" aria-label="Imagem ampliada">
          <div className="no-scrollbar h-full overflow-auto">
            <div className="relative mx-auto h-[160vh] w-full max-w-5xl md:h-[180vh]">
              <Image
                src={images[zoomAt].url}
                alt={images[zoomAt].alt || name}
                fill
                quality={90}
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>
          <button type="button" onClick={() => setZoomAt(null)} className="fixed right-3 top-3 grid h-12 w-12 place-items-center bg-paper text-ink" aria-label="Fechar">
            <X className="h-6 w-6" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setZoomAt((zoomAt - 1 + images.length) % images.length)}
                className="fixed left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center bg-paper/90 text-ink"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => setZoomAt((zoomAt + 1) % images.length)}
                className="fixed right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center bg-paper/90 text-ink"
                aria-label="Imagem seguinte"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <p className="tag fixed bottom-4 left-1/2 -translate-x-1/2 bg-paper px-3 py-1 text-ink">
            {zoomAt + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
