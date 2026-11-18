import { AccountDetailsForm } from "@/components/shop/forms/account-details-form";

export const metadata = { title: "Account details" };

// My account → Account details: name, display name, email, change password.
export default function AccountDetailsPage() {
  return <AccountDetailsForm />;
}
