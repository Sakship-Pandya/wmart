import { connection } from "next/server";

// Admin authentication — owned by the admin-panel developer.
// TODO: replace with real auth (e.g. Auth.js with email login, limited to ADMIN_EMAILS).

/**
 * Call at the top of every admin page/layout/server action.
 * Until real auth exists this only allows access in development, so the admin
 * panel can never be opened on the live site by accident.
 */
export async function requireAdmin(): Promise<void> {
  await connection(); // always check at request time, never during the build
  if (process.env.NODE_ENV === "production") {
    throw new Error("Admin authentication is not implemented yet.");
  }
}
