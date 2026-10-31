import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopBrowser } from "@/components/ShopBrowser";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse modest abayas, dresses, sets and more from AOT.ng.",
};

export default function ShopPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-4xl md:text-5xl">Shop</h1>
      <Suspense>
        <ShopBrowser products={products} />
      </Suspense>
    </div>
  );
}
