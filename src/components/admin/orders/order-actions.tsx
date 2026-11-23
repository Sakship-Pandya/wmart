"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { OrderStatus, PaymentStatus, ShipmentStatus } from "@/generated/prisma/enums";
import {
  PAYMENT_STATUSES,
  SHIPMENT_STATUSES,
  orderStatusInfo,
  paymentStatusInfo,
  shipmentStatusLabel,
} from "@/lib/orders";
import { addOrderNote, saveShipment, updateOrderStatus, updatePaymentStatus } from "@/server/actions/admin/orders";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring";

function useAction() {
  const [isPending, startTransition] = useTransition();
  const run = (fn: () => Promise<unknown>, success: string, after?: () => void) =>
    startTransition(async () => {
      try {
        await fn();
        toast.success(success);
        after?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  return { isPending, run };
}

export function OrderStatusForm({ orderId, nextStatuses }: { orderId: string; nextStatuses: OrderStatus[] }) {
  const { isPending, run } = useAction();
  const [next, setNext] = useState<OrderStatus | "">(nextStatuses[0] ?? "");
  const [note, setNote] = useState("");

  if (nextStatuses.length === 0) {
    return <p className="text-sm text-muted-foreground">This order is closed. No further status changes.</p>;
  }
  const cancelling = next === "CANCELLED";

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!next) return;
        if (cancelling && !confirm("Cancel this order? Its items will be returned to stock.")) return;
        run(() => updateOrderStatus(orderId, next, note), `Order marked ${orderStatusInfo[next].label.toLowerCase()}`, () => setNote(""));
      }}
    >
      <label className="text-xs font-medium text-muted-foreground" htmlFor="next-status">
        Change status to
      </label>
      <select id="next-status" className={selectClass} value={next} onChange={(e) => setNext(e.target.value as OrderStatus)} disabled={isPending}>
        {nextStatuses.map((s) => (
          <option key={s} value={s}>
            {orderStatusInfo[s].label}
          </option>
        ))}
      </select>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={cancelling ? "Reason for cancelling (required)" : "Note for the timeline (optional)"}
        rows={2}
        maxLength={500}
        disabled={isPending}
      />
      <Button type="submit" size="sm" className="w-full" variant={cancelling ? "destructive" : "default"} disabled={isPending || !next}>
        {isPending ? "Saving…" : cancelling ? "Cancel order" : "Update status"}
      </Button>
    </form>
  );
}

export function PaymentStatusForm({ orderId, current }: { orderId: string; current: PaymentStatus }) {
  const { isPending, run } = useAction();
  const [status, setStatus] = useState<PaymentStatus>(current);

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updatePaymentStatus(orderId, status), "Payment status updated");
      }}
    >
      <select aria-label="Payment status" className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus)} disabled={isPending}>
        {PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {paymentStatusInfo[s].label}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline" disabled={isPending || status === current}>
        Save
      </Button>
    </form>
  );
}

export function ShipmentForm({
  orderId,
  awb,
  status,
}: {
  orderId: string;
  awb: string | null;
  status: ShipmentStatus | null;
}) {
  const { isPending, run } = useAction();
  const [awbValue, setAwb] = useState(awb ?? "");
  const [statusValue, setStatus] = useState<ShipmentStatus>(status ?? "PENDING");

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveShipment(orderId, { awb: awbValue, status: statusValue }), "Shipment saved");
      }}
    >
      <label className="text-xs font-medium text-muted-foreground" htmlFor="awb">
        Delhivery AWB number
      </label>
      <Input id="awb" value={awbValue} onChange={(e) => setAwb(e.target.value)} placeholder="e.g. 1234567890123" className="font-mono" disabled={isPending} />
      <select aria-label="Shipment status" className={selectClass} value={statusValue} onChange={(e) => setStatus(e.target.value as ShipmentStatus)} disabled={isPending}>
        {SHIPMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {shipmentStatusLabel[s]}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline" className="w-full" disabled={isPending}>
        {isPending ? "Saving…" : "Save shipment"}
      </Button>
    </form>
  );
}

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const { isPending, run } = useAction();
  const [note, setNote] = useState("");
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => addOrderNote(orderId, note), "Note added", () => setNote(""));
      }}
    >
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a private note (only admins see this)" rows={2} maxLength={1000} disabled={isPending} />
      <Button type="submit" size="sm" variant="outline" disabled={isPending || !note.trim()}>
        {isPending ? "Adding…" : "Add note"}
      </Button>
    </form>
  );
}
