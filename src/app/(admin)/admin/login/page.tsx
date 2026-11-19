import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const instant = false;

export const metadata = {
  title: "Admin Login | WMart",
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  return <AdminLoginForm />;
}

