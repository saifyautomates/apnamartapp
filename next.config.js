const SUPABASE_DB_URL =
  "postgresql://postgres.ezwkjxhdkhgvyahypsjn:Hufsasaifquazi@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=3";

// Ensure DATABASE_URL is never undefined in serverless builds or cloud runtimes
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = SUPABASE_DB_URL;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  swcMinify: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL || SUPABASE_DB_URL,
    DIRECT_URL:
      process.env.DIRECT_URL ||
      "postgresql://postgres.ezwkjxhdkhgvyahypsjn:Hufsasaifquazi@aws-0-ap-south-1.pooler.supabase.com:5432/postgres",
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ezwkjxhdkhgvyahypsjn.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6d2tqeGhka2hndnlhaHlwc2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5Nzg1OTEsImV4cCI6MjEwOTU1NDU5MX0.ebPntydKslECC1Ta45fMw9-ghe5EDVlI7u50wuMGaUY",
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6d2tqeGhka2hndnlhaHlwc2puIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mzk3ODU5MSwiZXhwIjoyMTA5NTU0NTkxfQ.YeHUovhGwwnfo3W4h5BKkCRQl6gUfZsaEEYMqb6KXbk",
    SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || "centralmart-media",
    JWT_SECRET:
      process.env.JWT_SECRET || "grocery-commerce-platform-dev-secret-key-2026-very-secure-jwt",
    JWT_REFRESH_SECRET:
      process.env.JWT_REFRESH_SECRET ||
      "grocery-commerce-platform-dev-refresh-secret-key-2026-very-secure",
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "https://apnamartapp.vercel.app",
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.grofers.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        // Global security headers for all routes
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Service worker must never be cached or updates will fail
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      {
        // Manifest caching
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
      {
        // Static assets and images caching
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Icons caching
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

module.exports = nextConfig;
