import { adminPageDenied } from "@/lib/admin-page";
import { BulkImportForm, FmcgScaleTool } from "@/components/admin-ui";

export default async function AdminBulkPage() {
  const denied = await adminPageDenied("products:write");
  if (denied) return denied;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#1c1c1c] tracking-tight">Bulk FMCG Operations &amp; Scalability</h1>
        <p className="mt-1 text-sm text-neutral-500 font-medium">
          Scale your Central Mart grocery catalogue up to 5,000 FMCG products with 1-click seeders, or import your custom distributor CSVs.
        </p>
      </div>

      {/* 1. 1-Click FMCG 5,000 Products Scalability Engine */}
      <FmcgScaleTool />

      {/* 2. Custom CSV Bulk Importer with Row-by-Row Validation */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
        <h2 className="text-base font-black text-[#1c1c1c] mb-1">
          Custom CSV Importer
        </h2>
        <p className="text-xs text-neutral-500 mb-4">
          Upload bulk product lines from distributor spreadsheets. Every row is strictly validated with line-number errors reported.
        </p>
        <BulkImportForm />
      </div>
    </div>
  );
}
