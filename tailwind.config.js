/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#0c831f", // Blinkit signature green
          800: "#096317",
          900: "#053d0e",
        },
        blinkit: {
          yellow: "#f8cb46",
          yellowHover: "#f3be2b",
          green: "#0c831f",
          greenHover: "#096317",
          greenLight: "#e8f5e9",
          dark: "#1c1c1c",
          gray: "#f4f6fb",
          border: "#edf0f7",
          red: "#ef4444",
        },
        ink: "#1c1c1c",
        muted: "#64748b",
        line: "#edf0f7",
        bg: "#f4f6fb",
        sale: "#0c831f",
        // Admin dashboard palette (preview design): fresh green primary,
        // soft gray page background, light card borders. Additive only —
        // existing storefront tokens above are untouched.
        admin: "#15803d",
        adminbg: "#f6f7f9",
        adminline: "#e5e7eb",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
      },
      backdropBlur: {
        xs: "2px",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
