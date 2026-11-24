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
  prismaClass?: typeof PrismaClient;
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

  const cached = globalForPrisma.prisma;
  if (cached && globalForPrisma.prismaClass === PrismaClient && globalForPrisma.prismaUrl === connectionString) {
    return cached;
  }
  // Stale (regenerated client or new database): close the old connections and start fresh.
  void globalForPrisma.pgPool?.end().catch(() => {});
  const { pool, client } = createClient(connectionString);
  Object.assign(globalForPrisma, { prisma: client, pgPool: pool, prismaClass: PrismaClient, prismaUrl: connectionString });
  return client;
}

export const db = getClient();
