"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateInvoice } from "@/server/actions/admin/orders";

/** Opens the browser's print dialog; choose "Save as PDF" there to download the invoice. */
export function PrintInvoiceButton() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      <Printer className="mr-1.5 size-4" />
      Print / Save as PDF
    </Button>
  );
}

export function GenerateInvoiceButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            const res = await generateInvoice(orderId);
            toast.success(`Invoice ${res.invoiceNumber} issued`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not issue the invoice");
          }
        })
      }
    >
      <FileText className="mr-1.5 size-4" />
      {isPending ? "Issuing…" : "Generate invoice"}
    </Button>
  );
}
