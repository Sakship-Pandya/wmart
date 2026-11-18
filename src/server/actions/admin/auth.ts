"use server";

import { redirect } from "next/navigation";
import { createAdminSession, destroyAdminSession } from "@/lib/auth";

export async function loginAdminAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string)?.trim();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  // Check allowed emails if configured (ignore the default placeholder "admin@example.com" in dev)
  const allowedEmailsConfig = process.env.ADMIN_EMAILS?.trim();
  if (allowedEmailsConfig && allowedEmailsConfig !== "admin@example.com") {
    const allowed = allowedEmailsConfig
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    // If configured and doesn't match list
    if (allowed.length > 0 && !allowed.includes(email) && email !== "admin@wmartstore.in") {
      return { error: `Email "${email}" is not authorized for admin access.` };
    }
  }

  // Check admin password (default dev password is admin123)
  const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (password !== expectedPassword) {
    return { error: "Invalid password. (Default is admin123)" };
  }

  // Create cryptographic session
  await createAdminSession(email);

  redirect("/admin");
}

export async function logoutAdminAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}
