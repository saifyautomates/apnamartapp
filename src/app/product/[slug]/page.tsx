import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailClient from "@/components/product-detail";
import BlinkitProductCard, { VariantCardProps } from "@/components/product-card";
import { SectionTitle } from "@/components/ui";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} — 10 Mins Delivery`,
    description: product.description ?? product.name,
    openGraph: { title: product.name, description: product.description ?? undefined, type: "website" },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      brand: true,
      category: true,
      subcategory: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { include: { inventory: true }, orderBy: { sellingPaise: "asc" } },
    },
  });
  if (!product || product.deletedAt || !product.isActive || !product.onlineVisible) notFound();

  const variants = product.variants.map((v) => ({
    id: v.id,
    name: v.name,
    packSize: v.packSize,
    mrpPaise: v.mrpPaise,
    sellingPaise: v.sellingPaise,
    onlinePricePaise: v.onlinePricePaise,
    priceSource: v.priceSource,
    sellable: v.inventory ? v.inventory.availableQty - v.inventory.reservedQty : 0,
  }));

  const images = product.images.length > 0 ? product.images.map((i) => i.url) : [`/images/products/${product.slug}.jpg`];

  const related = await prisma.productVariant.findMany({
    where: {
      product: { isActive: true, onlineVisible: true, deletedAt: null, categoryId: product.categoryId, id: { not: product.id } },
    },
    include: { product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } }, inventory: true },
    take: 6,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    brand: product.brand?.name,
    category: product.category.name,
    offers: variants.map((v) => ({
      "@type": "Offer",
      price: ((v.priceSource === "CUSTOM" && v.onlinePricePaise != null ? v.onlinePricePaise : v.sellingPaise) / 100).toFixed(2),
      priceCurrency: "INR",
      availability: v.sellable > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted font-medium overflow-x-auto no-scrollbar py-1">
        <Link href="/" className="hover:text-emerald-700">Home</Link>
        <span>/</span>
        <Link href={`/category/${product.category.slug}`} className="hover:text-emerald-700">{product.category.name}</Link>
        {product.subcategory ? (
          <>
            <span>/</span>
            <Link href={`/category/${product.category.slug}?sub=${product.subcategory.slug}`} className="hover:text-emerald-700">{product.subcategory.name}</Link>
          </>
        ) : null}
        <span>/</span>
        <span className="text-ink font-bold truncate">{product.name}</span>
      </nav>

      {/* Title & Brand */}
      <div>
        <p className="text-xs font-black text-muted uppercase tracking-wider">
          {product.brand?.name ?? "Grocery Essential"}
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-black text-ink">{product.name}</h1>
      </div>

      {/* Main Product Showcase Card */}
      <ProductDetailClient variants={variants} images={images} productName={product.name} />

      {/* Product Information Details */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-7 shadow-xs space-y-4">
        <h2 className="text-base sm:text-lg font-black text-ink">Product Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700">
          <div>
            <h4 className="font-bold text-ink">Description</h4>
            <p className="mt-1 text-muted leading-relaxed">
              {product.description ?? `${product.name} is a high quality grocery essential, packed and delivered fresh to your doorstep in 10 minutes.`}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-muted">Brand</span>
              <span className="font-bold text-ink">{product.brand?.name ?? "General"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-muted">Category</span>
              <span className="font-bold text-ink">{product.category.name}</span>
            </div>
            {product.hsnSac ? (
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-muted">HSN Code</span>
                <span className="font-bold text-ink">{product.hsnSac}</span>
              </div>
            ) : null}
            <div className="flex justify-between py-1.5">
              <span className="text-muted">GST Rate (Included)</span>
              <span className="font-bold text-emerald-700">{(product.gstBps / 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together / Related */}
      {related.length > 0 ? (
        <section className="space-y-4">
          <SectionTitle
            title="Customers Also Bought"
            subtitle="Popular companion items delivered in 10 mins"
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
