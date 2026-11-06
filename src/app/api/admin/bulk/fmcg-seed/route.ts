import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { seedFmcgDatabase, buildFmcgProductCatalogue } from "@/lib/fmcg-catalog";
import { z } from "zod";

export const runtime = "nodejs";

const seedSchema = z.object({
  count: z.number().int().min(10).max(5000).default(500),
  preview: z.boolean().default(false),
});

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  await requireAdmin(req);
  const body = seedSchema.parse(await readJson(req));

  if (body.preview) {
    const sample = buildFmcgProductCatalogue(body.count).slice(0, 15);
    return ok({
      preview: true,
      targetCount: body.count,
      sample,
      message: `Preview generated for ${body.count} FMCG products. Ready to seed into database.`,
    });
  }

  const result = await seedFmcgDatabase(body.count);
  return ok({
    preview: false,
    ...result,
    message: `Successfully seeded ${result.processedProducts} FMCG products with live inventory!`,
  });
});

