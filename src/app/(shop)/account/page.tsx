import { Suspense } from "react";
import { WelcomeGreeting } from "@/components/shop/account/welcome-greeting";
import { Skeleton } from "@/components/ui/skeleton";
import { customerName, requireCustomer } from "@/lib/customer-session";

// My account → Dashboard (rendered inside the account layout's login check).
// Just a friendly welcome – the sections are in the account menu.
//
// The customer lookup sits in its own <Suspense>: when moving between account pages the layout's
// boundary stays mounted and can't show a fallback, so without this the navigation would wait
// for the database (Next.js "uncached data during a navigation" insight).
export default function AccountDashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="min-h-80 rounded-3xl" />}>
      <Welcome />
    </Suspense>
  );
}

async function Welcome() {
  const customer = await requireCustomer("/account");
  return <WelcomeGreeting name={customerName(customer)} />;
}
