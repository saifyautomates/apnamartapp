import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is initialized before PrismaClient evaluates env("DATABASE_URL")
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://postgres:postgres@localhost:5432/grocery_commerce?schema=public";
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Fast timeout wrapper for resilient operations — fails fast to fallback if DB is slow or offline */
export async function withDbTimeout<T>(promise: Promise<T>, timeoutMs = 250): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Database operation timeout")), timeoutMs)
    ),
  ]);
}
