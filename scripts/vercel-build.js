const { execSync } = require("child_process");

const SUPABASE_DB_URL =
  "postgresql://postgres.ezwkjxhdkhgvyahypsjn:Hufsasaifquazi@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=3";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = SUPABASE_DB_URL;
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL =
    "postgresql://postgres.ezwkjxhdkhgvyahypsjn:Hufsasaifquazi@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://ezwkjxhdkhgvyahypsjn.supabase.co";
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6d2tqeGhka2hndnlhaHlwc2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5Nzg1OTEsImV4cCI6MjEwOTU1NDU5MX0.ebPntydKslECC1Ta45fMw9-ghe5EDVlI7u50wuMGaUY";
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6d2tqeGhka2hndnlhaHlwc2puIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mzk3ODU5MSwiZXhwIjoyMTA5NTU0NTkxfQ.YeHUovhGwwnfo3W4h5BKkCRQl6gUfZsaEEYMqb6KXbk";
}
if (!process.env.SUPABASE_STORAGE_BUCKET) {
  process.env.SUPABASE_STORAGE_BUCKET = "centralmart-media";
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "grocery-commerce-platform-dev-secret-key-2026-very-secure-jwt";
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = "grocery-commerce-platform-dev-refresh-secret-key-2026-very-secure";
}
if (!process.env.NEXT_PUBLIC_BASE_URL) {
  process.env.NEXT_PUBLIC_BASE_URL = "https://apnamartapp.vercel.app";
}

if (!process.env.NEXT_CPU_COUNT) {
  process.env.NEXT_CPU_COUNT = "1";
}

console.log("[Vercel-Build] Running prisma generate with Supabase environment...");
execSync("npx prisma generate", { stdio: "inherit", env: process.env });

console.log("[Vercel-Build] Running next build...");
execSync("npx next build", { stdio: "inherit", env: process.env });

