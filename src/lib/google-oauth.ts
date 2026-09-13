/**
 * "Entrar com Google" — OAuth 2.0 / OpenID Connect escrito à mão (mesmo
 * padrão do ayaha-crm), com PKCE e `state` contra CSRF.
 *
 * O perfil vem do endpoint `userinfo` do Google com o access_token que nós
 * próprios trocámos (com o client_secret) — por isso não é preciso validar a
 * assinatura do id_token.
 *
 * Credenciais: Google Cloud Console → APIs e serviços → Credenciais →
 * ID do cliente OAuth (aplicação Web). URIs de redirecionamento autorizados:
 *   https://<domínio>/api/auth/google/callback
 *   http://localhost:3000/api/auth/google/callback
 */

import { createHash, randomBytes } from "node:crypto";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

export const OAUTH_COOKIE = "ci_google_oauth";

export function googleEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(origin: string) {
  return `${origin}/api/auth/google/callback`;
}

export function createOAuthRequest(origin: string) {
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", googleRedirectUri(origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");

  return { url: url.toString(), state, verifier };
}

export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
};

export async function exchangeCodeForProfile(code: string, verifier: string, origin: string): Promise<GoogleProfile> {
  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      code_verifier: verifier,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) throw new Error(`Troca de código Google falhou: ${tokenRes.status} ${await tokenRes.text()}`);
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const profileRes = await fetch(USERINFO_ENDPOINT, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!profileRes.ok) throw new Error(`Perfil Google falhou: ${profileRes.status}`);
  return (await profileRes.json()) as GoogleProfile;
}
