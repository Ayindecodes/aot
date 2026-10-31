"use client";

import { useState, type ReactNode } from "react";
import type { Product } from "@/data/products";
import { ProductGallery } from "./ProductGallery";
import { ProductPurchase } from "./ProductPurchase";

export function ProductView({
  product,
  summary,
  details,
}: {
  product: Product;
  summary: ReactNode;
  details: ReactNode;
}) {
  const [color, setColor] = useState(product.colors?.[0]?.name ?? "");

  return (
    <div className="mt-4 grid gap-8 md:grid-cols-2 lg:gap-14">
      <div className="md:sticky md:top-24 md:self-start">
        <ProductGallery product={product} color={color} onColorChange={setColor} />
      </div>
      <div>
        {summary}
        <ProductPurchase product={product} color={color} onColorChange={setColor} />
        {details}
      </div>
    </div>
  );
}
