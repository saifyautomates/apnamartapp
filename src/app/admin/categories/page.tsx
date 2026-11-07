import { adminPageDenied } from "@/lib/admin-page";
import { prisma, withDbTimeout } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin-ui";
import { getFallbackCategories } from "@/lib/resilient-catalog";

export default async function AdminCategoriesPage() {
  const denied = await adminPageDenied("categories:write");
  if (denied) return denied;

  let categories: any[] = [];
  try {
    categories = await withDbTimeout(
      prisma.category.findMany({
        include: { subcategories: true, _count: { select: { products: true } } },
        orderBy: { sortOrder: "asc" },
      }),
      250
    );
  } catch {
    /* fallback */
  }

  if (categories.length === 0) {
    categories = getFallbackCategories().map((c) => ({
      ...c,
      _count: { products: 12 },
    }));
  }
  return (
    <div>
      <h1 className="text-2xl font-bold">Categories</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="rounded-lg border border-line bg-white p-4">
            <p className="font-bold">{c.name}</p>
            <p className="text-sm text-muted">{c._count.products} product(s) · {c.isVisible ? "Active" : "Hidden"}</p>
            {c.subcategories.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {c.subcategories.map((s: any) => (
                  <li key={s.id}>{s.name}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
      <h2 className="mt-6 text-lg font-bold">Add category</h2>
      <div className="mt-2">
        <CategoryForm />
      </div>
    </div>
  );
}
