"use client";

import { useActionState } from "react";
import { ORDER_STATUS, ORDER_STATUS_LIST } from "@/lib/order-status";
import { updateOrderStatus, type OrderFormState } from "../actions";

export function StatusForm({
  orderId,
  status,
  trackingCode,
  stockCommitted,
}: {
  orderId: string;
  status: string;
  trackingCode: string;
  stockCommitted: boolean;
}) {
  const [state, action, pending] = useActionState<OrderFormState, FormData>(updateOrderStatus, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <select name="status" defaultValue={status} className="field" aria-label="Estado da encomenda">
        {ORDER_STATUS_LIST.map((s) => (
          <option key={s} value={s}>{ORDER_STATUS[s].label}</option>
        ))}
      </select>
      <input name="trackingCode" defaultValue={trackingCode} placeholder="Código de seguimento (opcional)" className="field" aria-label="Código de seguimento" />
      <textarea name="note" rows={2} placeholder="Nota para o histórico (opcional)" className="field" aria-label="Nota" />
      <p className="text-xs text-muted">
        {stockCommitted
          ? "Stock já descontado. Cancelar ou reembolsar devolve-o."
          : "Marcar como Pago (ou seguinte) desconta o stock. Falha se já não houver unidades."}
      </p>
      {state?.message && (
        <p role="status" className={`p-2 text-sm font-semibold ${state.ok ? "bg-emerald-100 text-emerald-900" : "bg-danger/10 text-danger"}`}>{state.message}</p>
      )}
      <button disabled={pending} className="btn btn-primary min-h-11 w-full">{pending ? "A atualizar…" : "Atualizar"}</button>
    </form>
  );
}
