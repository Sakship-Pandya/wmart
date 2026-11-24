import { notFound } from "next/navigation";
import { AddressForm } from "@/components/shop/forms/address-form";
import { requireCustomer } from "@/lib/customer-session";
import { getCustomerAddresses } from "@/server/queries/account";

export const metadata = { title: "Edit address" };

// My account → Addresses → /account/addresses/billing or /account/addresses/shipping
export default async function EditAddressPage({ params }: PageProps<"/account/addresses/[type]">) {
  const { type } = await params;
  if (type !== "billing" && type !== "shipping") notFound();
  const customer = await requireCustomer(`/account/addresses/${type}`);
  const saved = (await getCustomerAddresses(customer.id))[type];
  const initial = saved
    ? { fullName: saved.fullName, phone: saved.phone, line1: saved.line1, line2: saved.line2 ?? "", city: saved.city, state: saved.state, pincode: saved.pincode }
    : { fullName: [customer.firstName, customer.lastName].filter(Boolean).join(" "), phone: customer.phone ?? "" };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">{type === "billing" ? "Billing address" : "Shipping address"}</h2>
      <AddressForm type={type} initial={initial} />
    </div>
  );
}
