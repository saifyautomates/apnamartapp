"use client";

import { useEffect, useState } from "react";

export interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function ProductImage({ src, alt, className = "", priority = false }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc || "/placeholder.svg"}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={`transition-transform duration-200 group-hover:scale-105 ${className}`}
      onError={() => {
        if (imgSrc !== "/placeholder.svg") {
          setImgSrc("/placeholder.svg");
        }
      }}
    />
  );
}

