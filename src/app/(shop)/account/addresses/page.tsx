import { SquarePen } from "lucide-react";

export const metadata = { title: "Addresses" };

// My account → Addresses: separate billing and shipping address, used by default at checkout.
// TODO: load the customer's saved addresses and add the edit forms
// (/account/addresses/billing and /account/addresses/shipping).
const types = [
  { key: "billing", title: "Billing address" },
  { key: "shipping", title: "Shipping address" },
] as const;

export default function AddressesPage() {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        The following addresses will be used on the checkout page by default.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        {types.map((t) => (
          <div key={t.key} className="space-y-3 rounded-2xl border p-6">
            <h2 className="text-xl font-bold">{t.title}</h2>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="inline-flex items-center gap-2 font-medium text-brand disabled:opacity-60"
            >
              <SquarePen className="size-4" />
              Add {t.title.toLowerCase()}
            </button>
            <p className="italic text-muted-foreground">You have not set up this type of address yet.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
