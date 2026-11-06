"use client";

import { useEffect, useState } from "react";

export interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProductImage({ src, alt, className = "" }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc || "/placeholder.svg"}
      alt={alt}
      loading="lazy"
      className={`transition-transform duration-200 group-hover:scale-105 ${className}`}
      onError={() => {
        if (imgSrc !== "/placeholder.svg") {
          setImgSrc("/placeholder.svg");
        }
      }}
    />
  );
}

