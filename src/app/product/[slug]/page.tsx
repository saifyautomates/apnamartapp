import { prisma, withDbTimeout } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductDetailView, BlinkitProductCard, VariantCardProps } from "@/components/product";
import { SectionTitle } from "@/components/ui";
import Link from "next/link";
import { getFallbackProduct, getFallbackVariants } from "@/lib/resilient-catalog";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let name = "";
  let desc = "";
  try {
    const product = await withDbTimeout(prisma.product.findUnique({ where: { slug: params.slug } }), 2500);
    if (product) {
      name = product.name;
      desc =
        product.description ??
        `Order ${product.name} online in Kota, Rajasthan with fast same-day doorstep delivery from Central Mart (80 Feet Road). Best prices & 100% authentic packaged FMCG grocery.`;
    }
  } catch {
    /* fallback */
  }
  if (!name) {
    const fb = getFallbackProduct(params.slug);
    if (fb) {
      name = fb.name;
      desc =
        fb.description ??
        `Order ${fb.name} online in Kota with same-day doorstep delivery from Central Mart 80 Feet Road.`;
    }
  }

  const title = name
    ? `${name} — Buy Online in Kota | Central Mart 80 Feet Road`
    : "Central Mart Kota — Same-Day Grocery Delivery";
  const description =
    desc ||
    "Order daily essentials online in Kota from Central Mart, 80 Feet Road. Fast same-day doorstep delivery.";

  return {
    title,
    description,
    keywords: [
      `${name.toLowerCase()} kota`,
      `buy ${name.toLowerCase()} online kota`,
      `${name.toLowerCase()} 80 feet road kota`,
      "grocery delivery kota",
      "central mart kota",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_IN",
      siteName: "Central Mart Kota",
    },
    alternates: {
      canonical: `/product/${params.slug}`,
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  let product: any = null;

  try {
    product = await withDbTimeout(
      prisma.product.findUnique({
        where: { slug: params.slug },
        include: {
          brand: true,
          category: true,
          subcategory: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: { include: { inventory: true }, orderBy: { sellingPaise: "asc" } },
        },
      }),
      2500
    );
  } catch {
    /* database unconfigured or sleeping */
  }

  if (!product || product.deletedAt || !product.isActive || !product.onlineVisible) {
    product = getFallbackProduct(params.slug);
  }

  if (!product) notFound();

  const variants = product.variants.map((v: any) => ({
    id: v.id,
    name: v.name,
    packSize: v.packSize,
    mrpPaise: v.mrpPaise,
    sellingPaise: v.sellingPaise,
    onlinePricePaise: v.onlinePricePaise,
    priceSource: v.priceSource,
    sellable: v.inventory ? v.inventory.availableQty - v.inventory.reservedQty : 0,
  }));

  const images = product.images && product.images.length > 0 ? product.images.map((i: any) => i.url) : [`/images/products/${product.slug}.jpg`];

  let related: any[] = [];
  try {
    related = await prisma.productVariant.findMany({
      where: {
        product: { isActive: true, onlineVisible: true, deletedAt: null, categoryId: product.category?.id, id: { not: product.id } },
      },
      include: { product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } }, inventory: true },
      take: 6,
    });
  } catch {
    /* fallback */
  }

  if (related.length === 0) {
    related = getFallbackVariants(product.category?.slug ? [product.category.slug] : undefined, 6) as any;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images.map((img: string) => (img.startsWith("http") ? img : `${baseUrl}${img}`)),
    description:
      product.description ??
      `Buy ${product.name} online in Kota from Central Mart, 80 Feet Road. Fast same-day doorstep grocery delivery.`,
    brand: {
      "@type": "Brand",
      name: product.brand?.name || "Central Mart",
    },
    category: product.category?.name,
    offers: variants.map(
      (v: {
        id: string;
        priceSource?: string;
        onlinePricePaise?: number | null;
        sellingPaise: number;
        sellable: number;
      }) => ({
        "@type": "Offer",
        price: (
          (v.priceSource === "CUSTOM" && v.onlinePricePaise != null
            ? v.onlinePricePaise
            : v.sellingPaise) / 100
        ).toFixed(2),
        priceCurrency: "INR",
        availability:
          v.sellable > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: {
          "@type": "GroceryStore",
          name: "Central Mart",
          address: {
            "@type": "PostalAddress",
            streetAddress: "80 Feet Road",
            addressLocality: "Kota",
            addressRegion: "Rajasthan",
            postalCode: "324005",
            addressCountry: "IN",
          },
        },
      })
    ),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category.name,
        item: `${baseUrl}/category/${product.category.slug}`,
      },
      ...(product.subcategory
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: product.subcategory.name,
              item: `${baseUrl}/category/${product.category.slug}?sub=${product.subcategory.slug}`,
            },
            {
              "@type": "ListItem",
              position: 4,
              name: product.name,
              item: `${baseUrl}/product/${product.slug}`,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 3,
              name: product.name,
              item: `${baseUrl}/product/${product.slug}`,
            },
          ]),
    ],
  };

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium overflow-x-auto no-scrollbar py-1">
        <Link href="/" className="hover:text-[#0c831f]">Home</Link>
        <span>/</span>
        <Link href={`/category/${product.category.slug}`} className="hover:text-[#0c831f]">{product.category.name}</Link>
        {product.subcategory ? (
          <>
            <span>/</span>
            <Link href={`/category/${product.category.slug}?sub=${product.subcategory.slug}`} className="hover:text-[#0c831f]">{product.subcategory.name}</Link>
          </>
        ) : null}
        <span>/</span>
        <span className="text-[#1c1c1c] font-bold truncate">{product.name}</span>
      </nav>

      {/* Main Product Showcase Card (Blinkit & Zepto Grade) */}
      <ProductDetailView
        variants={variants}
        images={images}
        productName={product.name}
        brandName={product.brand?.name}
        categoryName={product.category.name}
        categorySlug={product.category.slug}
        description={product.description}
      />

      {/* Similar Products Rail */}
      {related.length > 0 ? (
        <section className="pt-2">
          <SectionTitle
            title="Customers Also Bought"
            subtitle="Frequently purchased together in this category"
            href={`/category/${product.category.slug}`}
          />
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {related.map((v) => (
              <BlinkitProductCard key={v.id} v={v as unknown as VariantCardProps} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
