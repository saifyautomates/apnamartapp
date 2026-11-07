"use client";

import { useEffect, useState } from "react";
import { FMCG_CATEGORIES_ROW_1, FMCG_CATEGORIES_ROW_2 } from "@/components/home/category-grid";
import { ProductImage } from "@/components/product/product-image";
import { openSearchModal } from "@/components/search/search-modal";

export function openCategoriesModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("open-categories-modal"));
  }
}

export function CategoryDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const allCategories = [...FMCG_CATEGORIES_ROW_1, ...FMCG_CATEGORIES_ROW_2];

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    window.addEventListener("open-categories-modal", handleOpen);
    window.addEventListener("close-categories-modal", handleClose);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("open-categories-modal", handleOpen);
      window.removeEventListener("close-categories-modal", handleClose);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer / Bottom Sheet */}
      <aside
        className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[680px] w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl z-50 animate-in slide-in-from-bottom sm:zoom-in-95 duration-250 overflow-hidden"
        aria-label="Browse Categories"
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white cursor-grab">
          <div className="h-1.5 w-12 rounded-full bg-neutral-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f5e9] text-[#0c831f] text-sm font-black">
              🗂️
            </span>
            <div>
              <h3 className="text-base font-black text-[#1c1c1c] leading-tight">
                All Grocery Categories
              </h3>
              <p className="text-[11px] text-neutral-400 font-medium">100% Genuine FMCG · Kota Delivery</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
            aria-label="Close categories"
          >
            ✕
          </button>
        </div>

        {/* Categories Grid Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-touch">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {allCategories.map((c) => (
              <a
                key={c.slug}
                href={c.href}
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(false);
                  // Open search with category keyword in-app
                  openSearchModal();
                  // Dispatch search for category name
                  setTimeout(() => {
                    const input = document.querySelector('input[placeholder*="Search for"]') as HTMLInputElement;
                    if (input) {
                      input.value = c.name.replace("\n", " ");
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                    }
                  }, 150);
                }}
                className="group flex flex-col items-center text-center p-2 rounded-2xl bg-[#f8faf8] hover:bg-[#e8f5e9]/50 border border-neutral-100 transition active:scale-95 cursor-pointer"
              >
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white p-2 shadow-xs group-hover:scale-105 transition flex items-center justify-center overflow-hidden">
                  <ProductImage src={c.img} alt={c.name} className="h-full w-full object-contain" />
                </div>
                <span className="mt-2 text-[11px] sm:text-xs font-bold text-[#1c1c1c] leading-tight whitespace-pre-line group-hover:text-[#0c831f] transition">
                  {c.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default CategoryDrawer;
