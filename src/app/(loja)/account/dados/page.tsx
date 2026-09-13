import { ActionForm } from "@/components/ui/action-form";
import { requireUser } from "@/lib/auth";
import { changePassword, updateProfile } from "../actions";

export default async function AccountDataPage() {
  const user = await requireUser();
  return (
    <div className="grid gap-12 md:grid-cols-2">
      <section>
        <h2 className="display text-3xl">Dados pessoais</h2>
        <ActionForm action={updateProfile} submitLabel="Guardar" className="mt-5 space-y-4">
          <div>
            <label htmlFor="name" className="label">Nome</label>
            <input id="name" name="name" defaultValue={user.name} required className="field" />
          </div>
          <div>
            <label htmlFor="email" className="label">E-mail</label>
            <input id="email" value={user.email} disabled className="field opacity-60" />
          </div>
          <div>
            <label htmlFor="phone" className="label">Telemóvel</label>
            <input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} className="field" />
          </div>
        </ActionForm>
      </section>

      <section>
        <h2 className="display text-3xl">Palavra-passe</h2>
        <ActionForm action={changePassword} submitLabel="Alterar palavra-passe" className="mt-5 space-y-4" resetOnSuccess>
          <div>
            <label htmlFor="current" className="label">Atual</label>
            <input id="current" name="current" type="password" autoComplete="current-password" required className="field" />
          </div>
          <div>
            <label htmlFor="next" className="label">Nova</label>
            <input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required className="field" />
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
