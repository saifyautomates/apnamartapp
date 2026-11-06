import { adminPageDenied } from "@/lib/admin-page";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { ZoneForm, SlotForm } from "@/components/admin-ui";

export default async function AdminDeliveryPage() {
  const denied = await adminPageDenied("delivery:write");
  if (denied) return denied;
  const zones = await prisma.deliveryZone.findMany({ include: { slots: true }, orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Delivery zones &amp; slots</h1>
      <div className="mt-4 space-y-3">
        {zones.map((z) => (
          <article key={z.id} className="rounded-lg border border-line bg-white p-4">
            <p className="font-bold">{z.name}</p>
            <p className="text-sm text-muted">
              PINs: {z.pincodes.join(", ")} · Min order {formatPaise(z.minOrderPaise)} · Charge {formatPaise(z.deliveryChargePaise)}
              {z.freeThresholdPaise ? ` · Free above ${formatPaise(z.freeThresholdPaise)}` : ""}
            </p>
            <p className="mt-1 text-sm">Slots: {z.slots.map((s) => s.label).join(" · ") || "None"}</p>
          </article>
        ))}
        {zones.length === 0 ? <p className="text-muted">No zones yet.</p> : null}
      </div>
      <h2 className="mt-6 text-lg font-bold">Add zone</h2>
      <div className="mt-2">
        <ZoneForm />
      </div>
      <h2 className="mt-6 text-lg font-bold">Add slot</h2>
      <div className="mt-2">
        <SlotForm zones={zones.map((z) => ({ id: z.id, name: z.name }))} />
      </div>
    </div>
  );
}
