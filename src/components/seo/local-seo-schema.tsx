import React from "react";

export interface LocalSeoProps {
  storeName?: string;
  tagline?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

export function LocalSeoSchema({
  storeName = "Central Mart",
  tagline = "Kota's #1 Online Supermarket — 80 Feet Road Same-Day Grocery Delivery",
  phone = "+91 98290 12345",
  address = "80 Feet Road, Kota, Rajasthan - 324005",
  logoUrl,
}: LocalSeoProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const iconUrl = logoUrl || `${baseUrl}/icons/icon-512.png`;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": ["GroceryStore", "Supermarket", "Store"],
    "@id": `${baseUrl}/#store`,
    name: storeName,
    alternateName: [
      "Central Mart Kota",
      "Central Mart 80 Feet Road",
      "Central Mart Supermarket Kota",
    ],
    url: baseUrl,
    logo: iconUrl,
    image: [
      iconUrl,
      `${baseUrl}/icons/icon-192.png`,
      `${baseUrl}/icons/maskable-512.png`,
    ],
    description:
      "Kota's premier online supermarket located at 80 Feet Road. Order 100% genuine packaged FMCG groceries, staples, dairy, snacks, cold drinks, cleaning & personal care with fast same-day delivery across Kota, Rajasthan.",
    telephone: phone,
    email: "contact@centralmart.in",
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, UPI, Credit Card, Debit Card, Net Banking",
    address: {
      "@type": "PostalAddress",
      streetAddress: "80 Feet Road",
      addressLocality: "Kota",
      addressRegion: "Rajasthan",
      postalCode: "324005",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 25.1388,
      longitude: 75.845,
    },
    hasMap: "https://maps.google.com/?q=80+Feet+Road+Kota+Rajasthan",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "08:00",
        closes: "22:00",
      },
    ],
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: "80 Feet Road, Kota",
      },
      {
        "@type": "AdministrativeArea",
        name: "Nayapura, Kota",
      },
      {
        "@type": "AdministrativeArea",
        name: "Talwandi, Kota",
      },
      {
        "@type": "AdministrativeArea",
        name: "Vigyan Nagar, Kota",
      },
      {
        "@type": "AdministrativeArea",
        name: "Dadabari, Kota",
      },
      {
        "@type": "AdministrativeArea",
        name: "Mahaveer Nagar, Kota",
      },
      {
        "@type": "AdministrativeArea",
        name: "Kunhari & Landmark City, Kota",
      },
      {
        "@type": "AdministrativeArea",
        name: "Jawahar Nagar, Kota",
      },
      {
        "@type": "AdministrativeArea",
        name: "Indra Vihar, Kota",
      },
      {
        "@type": "AdministrativeArea",
        name: "Rajeev Gandhi Nagar, Kota",
      },
      {
        "@type": "City",
        name: "Kota, Rajasthan",
      },
    ],
    potentialAction: [
      {
        "@type": "OrderAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/`,
          inLanguage: "en-IN",
          actionPlatform: [
            "http://schema.org/DesktopWebPlatform",
            "http://schema.org/MobileWebPlatform",
            "http://schema.org/AndroidPlatform",
            "http://schema.org/IOSPlatform",
          ],
        },
        deliveryMethod: [
          "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet",
          "http://purl.org/goodrelations/v1#DeliveryModePickUp",
        ],
      },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: storeName,
    alternateName: "Central Mart Online Grocery Kota",
    description: tagline,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: ["en-IN", "hi-IN"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

