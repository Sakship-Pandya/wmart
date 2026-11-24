import { AccountDetailsForm } from "@/components/shop/forms/account-details-form";
import { requireCustomer } from "@/lib/customer-session";

export const metadata = { title: "Account details" };

// My account → Account details: name, display name, email, change password.
export default async function AccountDetailsPage() {
  const c = await requireCustomer("/account/details");
  return (
    <AccountDetailsForm
      initial={{ firstName: c.firstName ?? "", lastName: c.lastName ?? "", displayName: c.displayName ?? "", email: c.email }}
    />
  );
}
