import type { Product } from "@/data/products";
import { discountPercent, formatNaira } from "@/lib/catalog";

export function Price({ product, className = "" }: { product: Product; className?: string }) {
  const discount = discountPercent(product);
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className="font-medium">
        {product.price === 0
          ? "Price on request"
          : `${product.options?.length ? "From " : ""}${formatNaira(product.price)}`}
      </span>
      {discount !== null && product.compareAtPrice && (
        <>
          <s className="text-sm text-muted">
            <span className="sr-only">Was </span>
            {formatNaira(product.compareAtPrice)}
          </s>
          <span className="text-sm text-mocha">{discount}% off</span>
        </>
      )}
    </p>
  );
}
