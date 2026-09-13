/**
 * Limite de pedidos em memória (janela fixa).
 *
 * Limitação conhecida: na Vercel cada instância tem a sua memória, por isso o
 * limite é por instância, não global. Chega para travar força bruta básica em
 * login/registo/checkout; o bloqueio de conta após 5 falhas (auth.ts) é
 * persistente no banco e cobre o resto. Se o tráfego crescer, trocar por
 * Upstash Redis (Vercel Marketplace) mantendo esta assinatura.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    }
    return true;
  }

  bucket.count++;
  return bucket.count <= limit;
}
