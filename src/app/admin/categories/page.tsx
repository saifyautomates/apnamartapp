import { adminPageDenied } from "@/lib/admin-page";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin-ui";

export default async function AdminCategoriesPage() {
  const denied = await adminPageDenied("categories:write");
  if (denied) return denied;
  const categories = await prisma.category.findMany({
    include: { subcategories: true, _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
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
                {c.subcategories.map((s) => (
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
