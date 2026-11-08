"use client";

import { useEffect, useState } from "react";

export interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

function getKeywordFallback(title: string): string {
  const t = (title || "").toLowerCase();
  // Dairy & Bakery
  if (t.includes("butter") || t.includes("makhan")) return "/images/products/amul-salted-butter.jpg";
  if (t.includes("ghee")) return "/images/products/amul-pure-cow-ghee.jpg";
  if (t.includes("paneer")) return "/images/products/amul-malai-fresh-paneer.jpg";
  if (t.includes("cheese")) return "/images/products/amul-cheese-slices.jpg";
  if (t.includes("wheat") && t.includes("bread")) return "/images/products/britannia-100-whole-wheat-bread.jpg";
  if (t.includes("white") && t.includes("bread")) return "/images/products/english-oven-premium-white-bread.jpg";
  if (t.includes("bread") || t.includes("bun") || t.includes("bakery") || t.includes("pav")) return "/images/products/english-oven-premium-white-bread.jpg";
  if (t.includes("egg") || t.includes("ande")) return "/images/products/farm-fresh-white-eggs.jpg";
  if (t.includes("curd") || t.includes("dahi") || t.includes("yogurt")) return "/images/products/amul-masti-cup-curd.jpg";
  if (t.includes("cream")) return "/images/products/amul-fresh-cream.jpg";
  if (t.includes("milk") || t.includes("doodh")) return "/images/products/amul-taaza-toned-milk.jpg";

  // Beverages & Cold Drinks
  if (t.includes("coke") || t.includes("coca-cola") || t.includes("coca cola")) return "/images/products/coca-cola-original-soft-drink.jpg";
  if (t.includes("thums")) return "/images/products/thums-up-charged-carbonated-drink.jpg";
  if (t.includes("sprite")) return "/images/products/sprite-refreshing-lemon-lime-drink.jpg";
  if (t.includes("red bull") || t.includes("energy drink")) return "/images/products/red-bull-energy-drink-canned.jpg";
  if (t.includes("pepsi")) return "/images/products/pepsi-soft-drink.jpg";
  if (t.includes("real") || t.includes("juice") || t.includes("mango")) return "/images/products/real-mango-juice.jpg";

  // Biscuits & Snacks
  if (t.includes("parle")) return "/images/products/parle-g-glucose-biscuits.jpg";
  if (t.includes("marie")) return "/images/products/britannia-marie-gold.jpg";
  if (t.includes("good day")) return "/images/products/britannia-good-day-cashew-cookies.jpg";
  if (t.includes("dark fantasy")) return "/images/products/sunfeast-dark-fantasy-choco-fills.jpg";
  if (t.includes("oreo")) return "/images/products/oreo-original-vanilla-creme-sandwich-biscuits.jpg";
  if (t.includes("biscuit") || t.includes("cookie")) return "/images/products/parle-g-glucose-biscuits.jpg";
  if (t.includes("lay") || t.includes("potato chips") || t.includes("wafer")) return "/images/products/lay-s-india-s-magic-masala-potato-chips.jpg";
  if (t.includes("kurkure")) return "/images/products/kurkure-masala-munch-crunchy-snacks.jpg";
  if (t.includes("chips") || t.includes("nachos") || t.includes("namkeen") || t.includes("bhujia")) return "/images/products/crispy-potato-chips.jpg";
  if (t.includes("maggi") || t.includes("noodle") || t.includes("pasta") || t.includes("yippee")) return "/images/products/maggi-2-minute-masala-instant-noodles.jpg";

  // Staples & Grocery
  if (t.includes("atta") || t.includes("flour") || t.includes("maida") || t.includes("suji")) return "/images/products/aashirvaad-shudh-chakki-atta.jpg";
  if (t.includes("rice") || t.includes("chawal") || t.includes("poha") || t.includes("basmati")) return "/images/products/india-gate-classic-super-basmati-rice.jpg";
  if (t.includes("oil") || t.includes("tel") || t.includes("mustard") || t.includes("sunflower")) return "/images/products/fortune-sunlite-refined-sunflower-oil.jpg";
  if (t.includes("salt") || t.includes("namak")) return "/images/products/tata-salt-vacuum-evaporated-iodised.jpg";
  if (t.includes("tea") || t.includes("chai")) return "/images/products/tata-tea-premium-desh-ki-chai.jpg";
  if (t.includes("coffee") || t.includes("nescafe") || t.includes("bru")) return "/images/products/nescafe-classic-100-pure-coffee-jar.jpg";

  // Household & Cleaning
  if (t.includes("surf") || t.includes("ariel") || t.includes("detergent") || t.includes("washing")) return "/images/products/surf-excel-matic-top-load-liquid-detergent.jpg";
  if (t.includes("vim") || t.includes("dishwash")) return "/images/products/vim-lemon-dishwash-gel-with-real-lemon.jpg";
  if (t.includes("lizol") || t.includes("floor cleaner")) return "/images/products/lizol-disinfectant-floor-cleaner-citrus-power.jpg";
  if (t.includes("harpic") || t.includes("toilet")) return "/images/products/harpic-power-plus-disinfectant-toilet-cleaner.jpg";
  if (t.includes("dettol") || t.includes("soap") || t.includes("lifebuoy")) return "/images/products/dettol-original-germ-protection-bathing-soap.jpg";
  if (t.includes("dove") || t.includes("body wash") || t.includes("shower gel")) return "/images/products/dove-deep-moisture-nourishing-body-wash.jpg";
  if (t.includes("paste") || t.includes("colgate") || t.includes("brush") || t.includes("toothpaste")) return "/images/products/colgate-strong-teeth-dental-paste-with-amino-shakti.jpg";
  if (t.includes("shampoo") || t.includes("head & shoulders") || t.includes("clinic plus")) return "/images/products/head-shoulders-smooth-silky-anti-dandruff-shampoo.jpg";

  return "/images/placeholder-product.svg";
}

export function ProductImage({ src, alt, className = "", priority = false }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src || getKeywordFallback(alt));
  const [attemptedFallback, setAttemptedFallback] = useState(false);

  useEffect(() => {
    setImgSrc(src || getKeywordFallback(alt));
    setAttemptedFallback(false);
  }, [src, alt]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      width="180"
      height="180"
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      className={`transition-all duration-300 ${className}`}
      onError={() => {
        if (!attemptedFallback) {
          setAttemptedFallback(true);
          const fallback = getKeywordFallback(alt);
          if (fallback !== imgSrc) {
            setImgSrc(fallback);
            return;
          }
        }
        if (imgSrc !== "/images/placeholder-product.svg") {
          setImgSrc("/images/placeholder-product.svg");
        }
      }}
    />
  );
}

export default ProductImage;
