import type { Product } from "@/data/products";
import { PhotoPlaceholder } from "./PhotoPlaceholder";

export function ProductImage({
  product,
  src = product.images[0],
  alt = product.name,
  className = "",
}: {
  product: Product;
  src?: string;
  alt?: string;
  className?: string;
}) {
  if (!src) return <PhotoPlaceholder className={`aspect-[3/4] ${className}`} />;
  return (
    // Static export has no image optimiser, so photos are sized before they're added.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`aspect-[3/4] w-full object-cover ${className}`}
    />
  );
}
