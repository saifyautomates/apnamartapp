import { PrismaClient } from "@prisma/client";

const DEFAULT_SUPABASE_DB_URL =
  "postgresql://postgres.ezwkjxhdkhgvyahypsjn:Hufsasaifquazi@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&connect_timeout=20&pool_timeout=20";

// Ensure DATABASE_URL is initialized before PrismaClient evaluates env("DATABASE_URL")
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_SUPABASE_DB_URL;
}

const activeDbUrl = process.env.DATABASE_URL || DEFAULT_SUPABASE_DB_URL;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: activeDbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Fast timeout wrapper for resilient operations — fails fast to fallback if DB is slow or offline */
export async function withDbTimeout<T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Database operation timeout")), timeoutMs)
    ),
  ]);
}
