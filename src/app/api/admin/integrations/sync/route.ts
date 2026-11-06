import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { enqueueSyncJob } from "@/lib/busy";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  provider: z.string().default("BUSY"),
  entityType: z.string(),
  entityId: z.string(),
  direction: z.enum(["INBOUND", "OUTBOUND"]),
  jobType: z.string(),
});

/** Enqueue a sync job (admin test hook). BUSY jobs fail gracefully with NOT_CONNECTED in v1. */
export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "integrations:write");
  const body = schema.parse(await readJson(req));
  const job = await enqueueSyncJob(body);
  return ok(job, 201);
});
