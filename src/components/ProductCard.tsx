"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/data/products";
import { availabilityLabel, discountPercent, imageFor, isOrderable } from "@/lib/catalog";
import { Price } from "./Price";
import { ProductImage } from "./ProductImage";

function sizeSummary(product: Product): string | null {
  const sizes = product.sizes?.join(", ");
  switch (product.sizing) {
    case "none":
      return null;
    case "standard":
      return sizes ?? null;
    case "custom":
      return "Made to your measurements";
    case "both":
      return `${sizes} or your measurements`;
  }
}

export function ProductCard({ product }: { product: Product }) {
  const href = `/product/${product.slug}`;
  const discount = discountPercent(product);
  const orderable = isOrderable(product.availability);
  const sizes = sizeSummary(product);
  const [color, setColor] = useState(product.colors?.[0]?.name);

  return (
    <article className="flex flex-col">
      <Link href={href} className="group block">
        <div className="relative overflow-hidden rounded-lg">
          <ProductImage
            product={product}
            src={imageFor(product, color)}
            alt={color ? `${product.name} in ${color}` : product.name}
            className="transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {discount !== null && (
            <span className="absolute right-2 top-2 rounded-full bg-ivory px-2.5 py-0.5 text-xs text-mocha">
              {discount}% off
            </span>
          )}
        </div>
        <h3 className="mt-3 text-xl">{product.name}</h3>
      </Link>
      <Price product={product} className="mt-1" />
      {sizes && <p className="mt-1 text-sm text-muted">{sizes}</p>}
      {!product.colors?.some((option) => option.image) ? (
        product.colors && <p className="mt-1 text-sm text-muted">Choose your colour</p>
      ) : (
        <ul className="-ml-1 mt-1 flex w-full" aria-label="Available colours">
          {product.colors?.map((option) => (
            <li key={option.name} className="w-1/4 max-w-10">
              <button
                type="button"
                title={option.name}
                aria-label={`Show ${product.name} in ${option.name}`}
                aria-pressed={color === option.name}
                onClick={() => setColor(option.name)}
                className="flex h-10 w-full items-center justify-center"
              >
                <span
                  className={`h-5 w-5 rounded-full border ${color === option.name ? "border-mocha ring-2 ring-mocha ring-offset-1" : "border-taupe"}`}
                  style={{ backgroundColor: option.hex }}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className={`mt-2 text-sm ${orderable ? "text-muted" : "font-medium text-mocha"}`}>
        {availabilityLabel(product.availability)}
      </p>
      <Link
        href={href}
        className="mt-1 inline-flex min-h-10 items-center self-start text-sm font-medium text-mocha underline underline-offset-4"
      >
        {orderable ? "Choose options" : "View details"}
      </Link>
    </article>
  );
}
