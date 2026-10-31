import type { Availability, Product } from "../data/products";

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function unitPrice(product: Product, option?: string): number {
  return product.options?.find((candidate) => candidate.name === option)?.price ?? product.price;
}

export function imageFor(product: Product, color?: string): string | undefined {
  return product.colors?.find((option) => option.name === color)?.image ?? product.images[0];
}

export function discountPercent(product: Product): number | null {
  const { price, compareAtPrice } = product;
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function isOrderable(availability: Availability): boolean {
  switch (availability.kind) {
    case "available":
    case "made_to_order":
      return true;
    case "limited":
      return availability.remaining > 0;
    case "sold_out":
      return false;
    case "custom":
      return availability.orderable;
  }
}

export function availabilityLabel(availability: Availability): string {
  switch (availability.kind) {
    case "available":
      return "Available";
    case "limited":
      return availability.remaining > 0 ? `Only ${availability.remaining} left` : "Sold out";
    case "sold_out":
      return "Sold out";
    case "made_to_order":
      return "Made to order";
    case "custom":
      return availability.label;
  }
}
