import { NextResponse, type NextRequest } from "next/server";
import { createOAuthRequest, googleEnabled, OAUTH_COOKIE } from "@/lib/google-oauth";

/** Passo 1: guarda state + PKCE num cookie curto e manda para o Google. */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  if (!googleEnabled()) return NextResponse.redirect(new URL("/login?erro=google-indisponivel", origin));

  const next = searchParams.get("next") ?? "";
  const safeNext = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "";

  const { url, state, verifier } = createOAuthRequest(origin);
  const response = NextResponse.redirect(url);
  response.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, verifier, next: safeNext }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return response;
}
