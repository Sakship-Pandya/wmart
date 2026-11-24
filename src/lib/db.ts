import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// One Prisma client and one pg Pool for the whole app. In development, Next.js reloads
// modules on every change, so both are kept on globalThis to avoid exhausting the connection pool.
//
// The kept client is only reused while it is still valid. It is replaced when:
//  - the Prisma client was regenerated (`prisma generate` after a schema change) – otherwise new
//    tables are missing, e.g. "Cannot read properties of undefined (reading 'findMany')";
//  - DATABASE_URL changed – otherwise the old database login keeps being used.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
  prismaUrl?: string;
};

function getConnectionString(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // Use sslmode=verify-full to suppress pg-connection-string security deprecation warning
  return url.replace("sslmode=require", "sslmode=verify-full");
}

function createClient(connectionString: string | undefined) {
  const pool = new Pool({ connectionString, max: 10 });
  const adapter = new PrismaPg(pool);
  return { pool, client: new PrismaClient({ adapter }) };
}

function getClient(): PrismaClient {
  const connectionString = getConnectionString();
  if (process.env.NODE_ENV === "production") return createClient(connectionString).client;

  // In development, reuse the existing client as long as DATABASE_URL hasn't changed.
  if (globalForPrisma.prisma && globalForPrisma.prismaUrl === connectionString) {
    return globalForPrisma.prisma;
  }

  const { pool, client } = createClient(connectionString);
  globalForPrisma.prisma = client;
  globalForPrisma.pgPool = pool;
  globalForPrisma.prismaUrl = connectionString;
  return client;
}

// Proxy ensures any file importing `db` always accesses the active global client,
// preventing stale instances across Next.js Turbopack HMR reloads.
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
