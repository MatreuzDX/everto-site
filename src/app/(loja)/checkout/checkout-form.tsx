"use client";

import { Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useStore } from "@/components/store/store-provider";
import { COUNTRIES } from "@/lib/countries";
import { formatPrice } from "@/lib/format";
import { placeOrder, type CheckoutState } from "./actions";

type Method = { id: string; label: string; description: string; available: boolean };
type Shipping = { id: string; name: string; countries: string[]; priceCents: number; freeOverCents: number | null; estimate: string | null };

function Field({
  name,
  label,
  error,
  className = "",
  ...props
}: { name: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input id={name} name={name} className={`field ${error ? "border-danger" : ""}`} aria-invalid={Boolean(error)} {...props} />
      {error && <p className="mt-1 text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}

export function CheckoutForm({
  methods,
  shipping,
  loggedIn,
  defaults,
}: {
  methods: Method[];
  shipping: Shipping[];
  loggedIn: boolean;
  defaults: Record<string, string>;
}) {
  const { cart, ready, clearCart } = useStore();
  const router = useRouter();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, null);
  const [country, setCountry] = useState(defaults.country || "PT");
  const [shippingId, setShippingId] = useState<string>("");
  const firstAvailable = methods.find((m) => m.available)?.id ?? "WHATSAPP";
  const [payment, setPayment] = useState(firstAvailable);

  const subtotal = cart.reduce((s, i) => s + i.priceCents * i.quantity, 0);
  const options = useMemo(
    () =>
      shipping
        .filter((s) => s.countries.includes(country))
        .map((s) => ({ ...s, finalCents: s.freeOverCents != null && subtotal >= s.freeOverCents ? 0 : s.priceCents })),
    [shipping, country, subtotal],
  );
  const chosen = options.find((o) => o.id === shippingId) ?? options[0];
  const shippingCents = chosen?.finalCents ?? 0;

  useEffect(() => {
    if (state?.ok) {
      clearCart();
      router.replace(state.url);
    }
  }, [state, clearCart, router]);

  const fields = state && !state.ok ? (state.fields ?? {}) : {};

  if (!ready) return <div className="skeleton mt-8 h-96" />;

  if (cart.length === 0 && !state?.ok) {
    return (
      <div className="mt-10 border-2 border-dashed border-ink/20 px-6 py-16 text-center">
        <p className="display text-4xl">Carrinho vazio</p>
        <Link href="/produtos" className="btn btn-primary mt-6">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]" noValidate>
      <input type="hidden" name="items" value={JSON.stringify(cart.map((c) => ({ variantId: c.variantId, quantity: c.quantity })))} />

      <div className="space-y-10">
        {!loggedIn && (
          <p className="text-sm">
            Já tens conta?{" "}
            <Link href="/login?next=/checkout" className="font-semibold underline">
              Inicia sessão
            </Link>{" "}
            para preencher mais depressa. Ou continua como convidado.
          </p>
        )}

        <fieldset>
          <legend className="display mb-4 text-3xl">1. Contacto</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label="Nome completo" autoComplete="name" defaultValue={defaults.name} error={fields.name} className="sm:col-span-2" required />
            <Field name="email" label="E-mail" type="email" autoComplete="email" inputMode="email" defaultValue={defaults.email} error={fields.email} required />
            <Field name="phone" label="Telefone" type="tel" autoComplete="tel" inputMode="tel" defaultValue={defaults.phone} error={fields.phone} required />
          </div>
        </fieldset>

        <fieldset>
          <legend className="display mb-4 text-3xl">2. Entrega</legend>
          <div className="grid gap-4 sm:grid-cols-6">
            <Field name="line1" label="Morada" autoComplete="address-line1" defaultValue={defaults.line1} error={fields.line1} className="sm:col-span-6" required />
            <Field name="line2" label="Andar, porta (opcional)" autoComplete="address-line2" defaultValue={defaults.line2} className="sm:col-span-6" />
            <Field name="postalCode" label="Código postal" autoComplete="postal-code" placeholder={country === "PT" ? "0000-000" : ""} defaultValue={defaults.postalCode} error={fields.postalCode} className="sm:col-span-2" required />
            <Field name="city" label="Cidade" autoComplete="address-level2" defaultValue={defaults.city} error={fields.city} className="sm:col-span-4" required />
            <div className="sm:col-span-6">
              <label htmlFor="country" className="label">
                País
              </label>
              <select id="country" name="country" value={country} onChange={(e) => setCountry(e.target.value)} className="field" autoComplete="country">
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <p className="label">Método de envio</p>
            {options.length === 0 ? (
              <p className="border border-ink/15 bg-white p-4 text-sm">
                O envio para este país é combinado contigo depois da encomenda.
              </p>
            ) : (
              <div className="grid gap-2">
                {options.map((o) => (
                  <label key={o.id} className="flex cursor-pointer items-center gap-3 border border-ink/15 bg-white p-4 has-[:checked]:border-ink has-[:checked]:ring-1 has-[:checked]:ring-ink">
                    <input type="radio" name="shippingMethodId" value={o.id} checked={chosen?.id === o.id} onChange={() => setShippingId(o.id)} className="h-5 w-5 accent-ink" />
                    <span className="flex-1">
                      <span className="block font-semibold">{o.name}</span>
                      {o.estimate && <span className="text-sm text-muted">{o.estimate}</span>}
                    </span>
                    <span className="font-bold tabular-nums">{o.finalCents === 0 ? "Grátis" : formatPrice(o.finalCents)}</span>
                  </label>
                ))}
              </div>
            )}
            {fields.shippingMethodId && <p className="mt-1 text-xs font-semibold text-danger">{fields.shippingMethodId}</p>}
          </div>

          {loggedIn && (
            <label className="mt-4 flex items-center gap-3 text-sm">
              <input type="checkbox" name="saveAddress" className="h-5 w-5 accent-ink" /> Guardar esta morada na minha conta
            </label>
          )}
        </fieldset>

        <fieldset>
          <legend className="display mb-4 text-3xl">3. Pagamento</legend>
          <div className="grid gap-2">
            {methods.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 border bg-white p-4 ${m.available ? "cursor-pointer border-ink/15 has-[:checked]:border-ink has-[:checked]:ring-1 has-[:checked]:ring-ink" : "cursor-not-allowed border-ink/10 opacity-55"}`}
              >
                <input type="radio" name="paymentMethod" value={m.id} disabled={!m.available} checked={payment === m.id} onChange={() => setPayment(m.id)} className="h-5 w-5 accent-ink" />
                <span className="flex-1">
                  <span className="block font-semibold">{m.label}</span>
                  <span className="text-sm text-muted">{m.description}</span>
                </span>
                {!m.available && <span className="tag bg-paper-2 px-2 py-1">Brevemente</span>}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="note" className="label">
            Nota para a loja (opcional)
          </label>
          <textarea id="note" name="note" rows={3} maxLength={500} className="field" />
        </div>
      </div>

      <aside className="h-fit bg-white p-6 lg:sticky lg:top-24">
        <p className="display text-3xl">A tua encomenda</p>
        <ul className="mt-5 space-y-4">
          {cart.map((item) => (
            <li key={item.variantId} className="flex gap-3">
              <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden bg-paper-2">
                {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />}
                <span className="absolute -right-0 -top-0 grid h-5 min-w-5 place-items-center bg-ink px-1 text-[0.65rem] font-bold text-paper">{item.quantity}</span>
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="line-clamp-2 font-semibold">{item.name}</p>
                <p className="tag text-muted">{[item.size, item.color].filter(Boolean).join(" · ")}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{formatPrice(item.priceCents * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-2 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Envio</dt>
            <dd className="tabular-nums">{options.length === 0 ? "A combinar" : shippingCents === 0 ? "Grátis" : formatPrice(shippingCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-3 text-lg font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(subtotal + shippingCents)}</dd>
          </div>
        </dl>

        <label className="mt-5 flex items-start gap-3 text-xs">
          <input type="checkbox" name="acceptTerms" className="mt-0.5 h-5 w-5 shrink-0 accent-ink" required />
          <span>
            Li e aceito os <Link href="/legal/termos" target="_blank" className="underline">termos e condições</Link> e a{" "}
            <Link href="/legal/privacidade" target="_blank" className="underline">política de privacidade</Link>.
          </span>
        </label>
        {fields.acceptTerms && <p className="mt-1 text-xs font-semibold text-danger">{fields.acceptTerms}</p>}

        {state && !state.ok && (
          <p role="alert" className="mt-4 bg-danger/10 p-3 text-sm font-semibold text-danger">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary mt-5 h-14 w-full">
          <Lock className="h-4 w-4" />
          {pending ? "A registar…" : "Confirmar encomenda"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">O preço e o stock são confirmados no momento da encomenda.</p>
      </aside>
    </form>
  );
}
