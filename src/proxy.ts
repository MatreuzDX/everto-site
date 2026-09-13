import { NextResponse, type NextRequest } from "next/server";

/**
 * Primeira barreira (Next 16: `proxy`, antes `middleware`).
 * Só verifica a PRESENÇA do cookie em /admin e /account; a validação a sério
 * (sessão válida, papel) é feita no servidor pelos layouts e Server Actions.
 * Tudo o resto é público por omissão.
 */

const PROTECTED = ["/admin", "/account"];

function startsWithSegment(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PROTECTED.some((p) => startsWithSegment(pathname, p)) && !request.cookies.has("ci_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return withHeaders(NextResponse.redirect(url));
  }

  return withHeaders(NextResponse.next());
}

function withHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|uploads|favicon.ico|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)",
  ],
};
