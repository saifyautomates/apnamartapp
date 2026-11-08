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
  if (t.includes("butter") || t.includes("makhan")) return "/images/products/amul-salted-butter.jpg";
  if (t.includes("ghee")) return "/images/products/amul-pure-cow-ghee.jpg";
  if (t.includes("paneer") || t.includes("cheese") || t.includes("cream")) return "/images/products/amul-malai-fresh-paneer.jpg";
  if (t.includes("bread") || t.includes("bun") || t.includes("bakery") || t.includes("pav")) return "/images/products/britannia-100-whole-wheat-bread.jpg";
  if (t.includes("egg") || t.includes("ande")) return "/images/products/farm-fresh-white-eggs.jpg";
  if (t.includes("curd") || t.includes("dahi") || t.includes("yogurt")) return "/images/products/amul-masti-cup-curd.jpg";
  if (t.includes("milk") || t.includes("doodh")) return "/images/products/amul-taaza-toned-milk.jpg";
  if (t.includes("atta") || t.includes("flour") || t.includes("maida") || t.includes("suji")) return "/images/products/aashirvaad-shudh-chakki-atta.jpg";
  if (t.includes("rice") || t.includes("chawal") || t.includes("poha")) return "/images/products/india-gate-basmati-rice.jpg";
  if (t.includes("oil") || t.includes("tel") || t.includes("mustard")) return "/images/products/fortune-sunflower-oil.jpg";
  if (t.includes("salt") || t.includes("namak")) return "/images/products/tata-salt-iodised.jpg";
  if (t.includes("noodle") || t.includes("maggi") || t.includes("pasta")) return "/images/products/maggi-2-minute-noodles.jpg";
  if (t.includes("chips") || t.includes("lay") || t.includes("kurkure") || t.includes("nachos") || t.includes("namkeen") || t.includes("bhujia")) return "/images/products/lay-s-india-s-magic-masala-potato-chips.jpg";
  if (t.includes("tea") || t.includes("chai")) return "/images/products/tata-tea-premium.jpg";
  if (t.includes("coffee") || t.includes("nescafe") || t.includes("bru")) return "/images/products/nescafe-classic-coffee.jpg";
  if (t.includes("biscuit") || t.includes("cookie") || t.includes("parle") || t.includes("marie") || t.includes("oreo") || t.includes("good day")) return "/images/products/britannia-good-day-cashew-cookies.jpg";
  if (t.includes("soap") || t.includes("dettol") || t.includes("dove") || t.includes("shampoo")) return "/images/products/dettol-original-soap.jpg";
  if (t.includes("cleaner") || t.includes("harpic") || t.includes("surf") || t.includes("detergent") || t.includes("vim")) return "/images/products/surf-excel-easy-wash-detergent-powder.jpg";
  if (t.includes("paste") || t.includes("colgate") || t.includes("dabur") || t.includes("brush")) return "/images/products/colgate-strong-teeth-toothpaste.jpg";
  if (t.includes("drink") || t.includes("coke") || t.includes("pepsi") || t.includes("juice") || t.includes("sprite") || t.includes("thums")) return "/images/products/coca-cola-original-taste.jpg";
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
      className={`transition-transform duration-200 group-hover:scale-105 ${className}`}
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
