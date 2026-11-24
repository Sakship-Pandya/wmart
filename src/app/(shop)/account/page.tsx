import Link from "next/link";
import { accountSections } from "@/components/shop/account/account-sections";
import { customerName, requireCustomer } from "@/lib/customer-session";
import { logout } from "@/server/actions/auth";

// My account → Dashboard (rendered inside the account layout's login check).
export default async function AccountDashboardPage() {
  const customer = await requireCustomer("/account");
  const name = customerName(customer);
  const shortcuts = accountSections.filter((s) => s.segment !== null);
  return (
    <div className="space-y-6">
      <p className="text-heading">
        Hello <strong>{name}</strong>{" "}
        <span className="text-muted-foreground">
          (not {name}?{" "}
          <form action={logout} className="inline">
            <button type="submit" className="cursor-pointer font-medium text-brand hover:underline">Log out</button>
          </form>
          )
        </span>
      </p>
      <p className="text-muted-foreground">
        From your account dashboard you can view your{" "}
        <Link href="/account/orders" className="font-medium text-brand hover:underline">recent orders</Link>, manage your{" "}
        <Link href="/account/addresses" className="font-medium text-brand hover:underline">shipping and billing addresses</Link>, and{" "}
        <Link href="/account/details" className="font-medium text-brand hover:underline">edit your password and account details</Link>.
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {shortcuts.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-2xl border p-5 font-medium text-heading transition hover:border-brand hover:text-brand">
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
