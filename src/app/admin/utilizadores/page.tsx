import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { Card, Notice, PageTitle } from "../ui";
import { createStaff, updateStaff } from "./actions";

const MSG: Record<string, string> = {
  criado: "Conta criada.",
  promovido: "Esse e-mail já tinha conta — passou a fazer parte da equipa.",
  atualizado: "Atualizado.",
  dados: "Dados inválidos (palavra-passe com 8+ caracteres).",
  proprio: "Não podes retirar o teu próprio acesso de administrador.",
  ultimo: "Tem de existir pelo menos um administrador ativo.",
};

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const me = await requireAdmin();
  const { ok, erro } = await searchParams;
  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      {ok && <Notice>{MSG[ok]}</Notice>}
      {erro && <Notice tone="error">{MSG[erro]}</Notice>}
      <PageTitle title="Equipa" description="ADMIN gere tudo. STAFF gere produtos, stock e encomendas, sem acesso a definições, clientes nem equipa." />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card title="Membros">
          <ul className="divide-y divide-ink/10">
            {staff.map((u) => (
              <li key={u.id} className="py-3">
                <form action={updateStaff} className="flex flex-wrap items-center gap-3">
                  <input type="hidden" name="id" value={u.id} />
                  <div className="min-w-48 flex-1">
                    <p className="font-semibold">{u.name}{u.id === me.id && <span className="tag ml-2 text-muted">tu</span>}</p>
                    <p className="text-xs text-muted">{u.email} · último acesso {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "nunca"}</p>
                  </div>
                  <select name="role" defaultValue={u.role} className="field min-h-9 w-auto py-1" aria-label="Papel">
                    <option value="ADMIN">ADMIN</option>
                    <option value="STAFF">STAFF</option>
                    <option value="CUSTOMER">Retirar da equipa</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={u.isActive} className="h-4 w-4 accent-ink" /> Ativo</label>
                  <button className="btn btn-outline min-h-9 px-3 text-xs">Guardar</button>
                </form>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Adicionar à equipa" className="h-fit">
          <form action={createStaff} className="space-y-3">
            <input name="name" placeholder="Nome" required className="field" aria-label="Nome" />
            <input name="email" type="email" placeholder="E-mail" required className="field" aria-label="E-mail" />
            <input name="password" type="password" placeholder="Palavra-passe inicial (8+)" minLength={8} required className="field" aria-label="Palavra-passe" />
            <select name="role" defaultValue="STAFF" className="field" aria-label="Papel">
              <option value="STAFF">STAFF</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <button className="btn btn-primary min-h-10 w-full">Adicionar</button>
          </form>
        </Card>
      </div>
    </div>
  );
}
