-- Enable trigram extension for fuzzy (typo-tolerant) search.
-- If the deploy database user cannot CREATE EXTENSION, ask a superuser to run
-- `CREATE EXTENSION IF NOT EXISTS pg_trgm;` once, then re-run this migration.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN indexes used by the fuzzy fallback in src/lib/search.ts
-- (word_similarity / <% operator on product name, brand name, variant SKU/barcode).
CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx" ON "Product" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Brand_name_trgm_idx" ON "Brand" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "ProductVariant_sku_trgm_idx" ON "ProductVariant" USING gin ("sku" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "ProductVariant_barcode_trgm_idx" ON "ProductVariant" USING gin ("barcode" gin_trgm_ops);
