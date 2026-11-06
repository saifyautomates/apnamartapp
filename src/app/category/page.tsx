import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ProductImage } from "@/components/shop";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    include: { subcategories: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  const categoryVisuals: Record<string, string> = {
    "dairy-eggs": "/images/categories/dairy-eggs.jpg",
    "staples": "/images/categories/staples.jpg",
    "snacks": "/images/categories/snacks.jpg",
    "beverages": "/images/categories/beverages.jpg",
    "household": "/images/categories/household.jpg",
    "personal-care": "/images/categories/personal-care.jpg",
    "breakfast": "/images/categories/breakfast.jpg",
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-100 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-ink">Explore Categories</h1>
          <p className="mt-0.5 text-xs text-muted font-medium">All items delivered to your doorstep in 10 minutes</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-extrabold">
          ⚡ 10 Mins Delivery
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const img = categoryVisuals[c.slug] ?? `/images/categories/${c.slug}.jpg`;
          return (
            <div
              key={c.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs hover:border-emerald-500 hover:shadow-md transition duration-200"
            >
              <div className="flex items-start gap-3.5">
                <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 p-1 flex items-center justify-center group-hover:scale-105 transition">
                  <ProductImage
                    src={img}
                    alt={c.name}
                    className="h-full w-full object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/category/${c.slug}`} className="text-base font-extrabold text-ink hover:text-emerald-700 transition">
                    {c.name}
                  </Link>
                  {c.description ? (
                    <p className="text-xs text-muted mt-0.5 line-clamp-1">{c.description}</p>
                  ) : null}
                  <Link
                    href={`/category/${c.slug}`}
                    className="inline-block mt-1 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    View all items →
                  </Link>
                </div>
              </div>

              {c.subcategories.length > 0 ? (
                <div className="mt-4 pt-3 border-t border-slate-50 flex flex-wrap gap-1.5">
                  {c.subcategories.map((s) => (
                    <Link
                      key={s.id}
                      href={`/category/${c.slug}?sub=${s.slug}`}
                      className="rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition"
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
