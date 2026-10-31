"use client";

import { useState } from "react";
import type { Product } from "@/data/products";
import { imageFor } from "@/lib/catalog";
import { ProductImage } from "./ProductImage";

export function ProductGallery({
  product,
  color,
  onColorChange,
}: {
  product: Product;
  color: string;
  onColorChange: (color: string) => void;
}) {
  const [selected, setSelected] = useState(0);
  const colorPhotos = product.colors?.filter((option) => option.image) ?? [];

  if (colorPhotos.length > 1) {
    return (
      <div>
        <ProductImage
          product={product}
          src={imageFor(product, color)}
          alt={`${product.name} in ${color}`}
          className="rounded-lg"
        />
        <ul className="mt-3 grid grid-cols-4 gap-2">
          {colorPhotos.map((option) => (
            <li key={option.name}>
              <button
                type="button"
                onClick={() => onColorChange(option.name)}
                aria-label={`Show ${option.name}`}
                aria-pressed={option.name === color}
                className={`block w-full overflow-hidden rounded border-2 ${option.name === color ? "border-mocha" : "border-transparent"}`}
              >
                <ProductImage product={product} src={option.image} alt="" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <ProductImage product={product} src={product.images[selected]} className="rounded-lg" />
      {product.images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {product.images.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-current={index === selected}
                className={`block w-full overflow-hidden rounded border-2 ${index === selected ? "border-mocha" : "border-transparent"}`}
              >
                <ProductImage product={product} src={image} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
