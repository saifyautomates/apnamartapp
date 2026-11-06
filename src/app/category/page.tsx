import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ProductImage } from "@/components/product";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    include: { subcategories: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 sm:p-6 border border-neutral-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1c1c1c]">All Categories</h1>
          <p className="mt-0.5 text-xs text-neutral-500 font-medium">All items delivered to your doorstep in 8 minutes</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f5e9] text-[#0c831f] border border-[#0c831f]/20 px-3 py-1 text-xs font-black">
          ⚡ 8 Mins Delivery
        </span>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const img = `/images/categories/${c.slug}.jpg`;
          return (
            <div
              key={c.id}
              className="group flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs hover:border-[#0c831f] hover:shadow-md transition duration-200"
            >
              <div className="flex items-start gap-3.5">
                <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-[#f2f7fc] border border-neutral-100 p-1 flex items-center justify-center group-hover:scale-105 transition">
                  <ProductImage
                    src={img}
                    alt={c.name}
                    className="h-full w-full object-contain rounded-lg"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/category/${c.slug}`} className="text-base font-black text-[#1c1c1c] hover:text-[#0c831f] transition">
                    {c.name}
                  </Link>
                  {c.description ? (
                    <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{c.description}</p>
                  ) : null}
                  <Link
                    href={`/category/${c.slug}`}
                    className="inline-block mt-1 text-xs font-bold text-[#0c831f] hover:underline"
                  >
                    View all items →
                  </Link>
                </div>
              </div>

              {c.subcategories.length > 0 ? (
                <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-wrap gap-1.5">
                  {c.subcategories.map((s) => (
                    <Link
                      key={s.id}
                      href={`/category/${c.slug}?sub=${s.slug}`}
                      className="rounded-lg bg-[#f8f8f8] hover:bg-[#e8f5e9] hover:text-[#0c831f] px-2.5 py-1 text-[11px] font-semibold text-neutral-600 transition"
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
