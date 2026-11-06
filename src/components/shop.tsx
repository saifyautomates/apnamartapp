/**
 * Backwards compatibility re-export.
 * Modular implementations are located in:
 * - API client: `@/lib/api/client`
 * - Product components: `@/components/product/*`
 * - Header/Search: `@/components/header/*`
 */
export { ensureCsrf, api } from "@/lib/api/client";
export { ProductImage } from "./product/product-image";
export { AddButton } from "./product/add-button";
export { SearchInput as SearchBar } from "./header/search-input";
