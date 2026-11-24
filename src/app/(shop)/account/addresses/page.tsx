import Link from "next/link";
import { CircleCheck, SquarePen } from "lucide-react";
import { requireCustomer } from "@/lib/customer-session";
import { getCustomerAddresses } from "@/server/queries/account";

export const metadata = { title: "Addresses" };

const types = [
  { key: "billing", title: "Billing address" },
  { key: "shipping", title: "Shipping address" },
] as const;

// My account → Addresses: separate billing and shipping address, used by default at checkout.
export default async function AddressesPage({ searchParams }: PageProps<"/account/addresses">) {
  const customer = await requireCustomer("/account/addresses");
  const [addresses, { saved }] = await Promise.all([getCustomerAddresses(customer.id), searchParams]);

  return (
    <div className="space-y-6">
      {saved && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          <CircleCheck className="size-4" /> Address saved.
        </p>
      )}
      <p className="text-muted-foreground">The following addresses will be used on the checkout page by default.</p>
      <div className="grid gap-6 md:grid-cols-2">
        {types.map((t) => {
          const a = addresses[t.key];
          return (
            <div key={t.key} className="space-y-3 rounded-2xl border p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold">{t.title}</h2>
                <Link href={`/account/addresses/${t.key}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
                  <SquarePen className="size-4" />
                  {a ? "Edit" : "Add"}
                </Link>
              </div>
              {a ? (
                <address className="space-y-0.5 text-sm not-italic text-heading">
                  <p className="font-semibold">{a.fullName}</p>
                  <p>{a.line1}</p>
                  {a.line2 && <p>{a.line2}</p>}
                  <p>{a.city}, {a.state} – {a.pincode}</p>
                  <p className="pt-1 text-muted-foreground">Mobile: {a.phone}</p>
                </address>
              ) : (
                <p className="italic text-muted-foreground">You have not set up this type of address yet.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
