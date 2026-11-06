import { adminPageDenied } from "@/lib/admin-page";
import { BulkImportForm } from "@/components/admin-ui";

export default async function AdminBulkPage() {
  const denied = await adminPageDenied("products:write");
  if (denied) return denied;
  return (
    <div>
      <h1 className="text-2xl font-bold">Bulk import / export</h1>
      <p className="mt-1 text-sm text-muted">Import products from CSV with a preview step. Every bad row is reported with its line number — nothing is silently ignored.</p>
      <div className="mt-4">
        <BulkImportForm />
      </div>
    </div>
  );
}
