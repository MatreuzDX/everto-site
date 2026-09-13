"use client";

/**
 * Analytics e consentimento de cookies (RGPD).
 *
 * Nada de terceiros carrega sem o "Aceitar". Os IDs vêm de variáveis de
 * ambiente reais; se estiverem vazias, não há scripts nem banner.
 */

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

const GA = process.env.NEXT_PUBLIC_GA_ID;
const GTM = process.env.NEXT_PUBLIC_GTM_ID;
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const KEY = "ci_cookie_consent";

export function Analytics() {
  const [consent, setConsent] = useState<"granted" | "denied" | null | "loading">("loading");
  const anyTracking = Boolean(GA || GTM || PIXEL);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê a escolha guardada uma vez
    setConsent(stored === "granted" || stored === "denied" ? stored : null);
  }, []);

  function choose(value: "granted" | "denied") {
    try {
      localStorage.setItem(KEY, value);
    } catch {}
    setConsent(value);
  }

  if (!anyTracking) return null;

  return (
    <>
      {consent === null && (
        <div className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-xl bg-ink p-4 text-sm text-paper shadow-2xl md:bottom-6">
          <p>
            Usamos cookies de medição para melhorar a loja, só com o teu consentimento.{" "}
            <Link href="/legal/cookies" className="underline">
              Saber mais
            </Link>
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => choose("granted")} className="btn btn-lime min-h-10 flex-1">
              Aceitar
            </button>
            <button type="button" onClick={() => choose("denied")} className="btn btn-outline min-h-10 flex-1">
              Recusar
            </button>
          </div>
        </div>
      )}

      {consent === "granted" && GTM && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM}');`}
        </Script>
      )}

      {consent === "granted" && GA && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
          <Script id="ga" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA}',{anonymize_ip:true});`}
          </Script>
        </>
      )}

      {consent === "granted" && PIXEL && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
