import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma, safe } from "@/lib/db";
import { checkoutMethods } from "@/lib/payments";
import { getSettings } from "@/lib/settings";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [settings, user, shipping] = await Promise.all([
    getSettings(),
    getCurrentUser(),
    safe(
      () =>
        prisma.shippingMethod.findMany({
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
          select: { id: true, name: true, countries: true, priceCents: true, freeOverCents: true, estimate: true },
        }),
      [],
    ),
  ]);

  const address = user
    ? await safe(
        () => prisma.address.findFirst({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
        null,
      )
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 md:px-6 md:pt-12">
      <h1 className="display text-6xl md:text-8xl">Checkout</h1>
      <CheckoutForm
        methods={checkoutMethods(settings.paymentMethods)}
        shipping={shipping}
        loggedIn={Boolean(user)}
        defaults={{
          name: address?.name ?? user?.name ?? "",
          email: user?.email ?? "",
          phone: address?.phone ?? user?.phone ?? "",
          line1: address?.line1 ?? "",
          line2: address?.line2 ?? "",
          postalCode: address?.postalCode ?? "",
          city: address?.city ?? "",
          country: address?.country ?? "PT",
        }}
      />
    </div>
  );
}
