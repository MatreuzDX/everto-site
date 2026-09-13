import { ActionForm } from "@/components/ui/action-form";
import { requireUser } from "@/lib/auth";
import { COUNTRIES, countryName } from "@/lib/countries";
import { prisma } from "@/lib/db";
import { addAddress, deleteAddress, setDefaultAddress } from "../actions";

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="grid gap-12 md:grid-cols-2">
      <section>
        <h2 className="display text-3xl">As minhas moradas</h2>
        {addresses.length === 0 ? (
          <p className="mt-4 text-muted">Ainda não guardaste moradas.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {addresses.map((a) => (
              <li key={a.id} className="border border-ink/10 bg-white p-4 text-sm">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{a.label || a.name}</p>
                  {a.isDefault && <span className="tag bg-lime px-2 py-0.5">Principal</span>}
                </div>
                <p className="mt-1 leading-relaxed text-ink/80">
                  {a.name}
                  <br />
                  {a.line1}
                  {a.line2 && `, ${a.line2}`}
                  <br />
                  {a.postalCode} {a.city}, {countryName(a.country)}
                </p>
                <div className="mt-3 flex gap-4">
                  {!a.isDefault && (
                    <form action={setDefaultAddress}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="text-sm font-semibold underline">Tornar principal</button>
                    </form>
                  )}
                  <form action={deleteAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="text-sm text-danger underline">Apagar</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="display text-3xl">Nova morada</h2>
        <ActionForm action={addAddress} submitLabel="Adicionar morada" className="mt-5 grid gap-4" resetOnSuccess>
          <input name="label" placeholder="Nome da morada (ex.: Casa)" className="field" aria-label="Nome da morada" />
          <input name="name" placeholder="Destinatário" required className="field" aria-label="Destinatário" defaultValue={user.name} />
          <input name="phone" type="tel" placeholder="Telefone" className="field" aria-label="Telefone" defaultValue={user.phone ?? ""} />
          <input name="line1" placeholder="Morada" required className="field" aria-label="Morada" />
          <input name="line2" placeholder="Andar, porta" className="field" aria-label="Andar, porta" />
          <div className="grid grid-cols-2 gap-4">
            <input name="postalCode" placeholder="Código postal" required className="field" aria-label="Código postal" />
            <input name="city" placeholder="Cidade" required className="field" aria-label="Cidade" />
          </div>
          <select name="country" defaultValue="PT" className="field" aria-label="País">
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </ActionForm>
      </section>
    </div>
  );
}
