import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { AuthError, isStaff, loginWithGoogle } from "@/lib/auth";
import { exchangeCodeForProfile, googleEnabled, OAUTH_COOKIE } from "@/lib/google-oauth";
import { rateLimit } from "@/lib/rate-limit";

/** Passo 2: o Google volta com um código → perfil verificado → sessão. */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;

  const fail = (erro: string) => {
    const response = NextResponse.redirect(new URL(`/login?erro=${erro}`, origin));
    response.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
    return response;
  };

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`google:${ip}`, 20, 10 * 60_000)) return fail("google");
  if (!googleEnabled() || searchParams.get("error")) return fail("google");

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  let stored: { state: string; verifier: string; next: string } | null = null;
  try {
    stored = JSON.parse(request.cookies.get(OAUTH_COOKIE)?.value ?? "null");
  } catch {}

  if (!code || !state || !stored?.state || !stored.verifier) return fail("google");
  const a = Buffer.from(state);
  const b = Buffer.from(stored.state);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return fail("google");

  try {
    const profile = await exchangeCodeForProfile(code, stored.verifier, origin);
    // Sem e-mail verificado não se liga a nenhuma conta (evita tomar contas alheias).
    if (!profile.email_verified || !profile.email) return fail("google-email");

    const user = await loginWithGoogle({
      googleId: profile.sub,
      email: profile.email,
      name: profile.name || profile.given_name || profile.email.split("@")[0],
    });

    const destination = stored.next || (isStaff(user.role) ? "/admin" : "/account");
    const response = NextResponse.redirect(new URL(destination, origin));
    response.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
    return response;
  } catch (error) {
    if (error instanceof AuthError) return fail("conta-inativa");
    console.error("[google-oauth]", error);
    return fail("google");
  }
}
