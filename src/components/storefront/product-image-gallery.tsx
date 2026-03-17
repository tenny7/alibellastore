"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-[#E2E8F0]">
        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
          No image
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop: thumbnails left, main right */}
      <div className="hidden lg:flex gap-3">
        {images.length > 1 && (
          <div className="flex flex-col gap-2 shrink-0">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors",
                  i === activeIndex
                    ? "border-primary"
                    : "border-[#E2E8F0] hover:border-gray-300"
                )}
              >
                <Image
                  src={img}
                  alt={`${productName} - ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
        <div className="relative flex-1 aspect-square rounded-xl overflow-hidden bg-gray-100 border border-[#E2E8F0]">
          <Image
            src={images[activeIndex]}
            alt={productName}
            fill
            className="object-cover"
            priority
            sizes="50vw"
          />
        </div>
      </div>

      {/* Mobile/Tablet: main image on top, horizontal thumbnails below */}
      <div className="lg:hidden space-y-3">
        <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-[#E2E8F0]">
          <Image
            src={images[activeIndex]}
            alt={productName}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors",
                  i === activeIndex
                    ? "border-primary"
                    : "border-[#E2E8F0] hover:border-gray-300"
                )}
              >
                <Image
                  src={img}
                  alt={`${productName} - ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
