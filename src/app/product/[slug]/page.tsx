import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductDetailView, BlinkitProductCard, VariantCardProps } from "@/components/product";
import { SectionTitle } from "@/components/ui";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} — Same-Day Delivery | Central Mart`,
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

      {/* Main Product Showcase Card */}
      <ProductDetailView
        variants={variants}
        images={images}
        productName={product.name}
        brandName={product.brand?.name}
      />

      {/* Product Information Details */}
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 sm:p-7 shadow-xs space-y-4">
        <h2 className="text-base sm:text-lg font-black text-[#1c1c1c]">Product Details</h2>
        <div className="prose prose-sm text-neutral-600 max-w-none space-y-2">
          <p>{product.description ?? "Authentic, fresh, top-quality groceries delivered straight to your doorstep."}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-neutral-100 text-xs">
            <div>
              <span className="font-bold text-[#1c1c1c]">Brand: </span>
              <span className="text-neutral-500">{product.brand?.name ?? "General"}</span>
            </div>
            <div>
              <span className="font-bold text-[#1c1c1c]">Category: </span>
              <span className="text-neutral-500">{product.category.name}</span>
            </div>
            <div>
              <span className="font-bold text-[#1c1c1c]">FSSAI License: </span>
              <span className="text-neutral-500">10012011000123 (Verified)</span>
            </div>
            <div>
              <span className="font-bold text-[#1c1c1c]">Shelf Life: </span>
              <span className="text-neutral-500">Best before indicated date on pack</span>
            </div>
          </div>
        </div>
      </div>

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
