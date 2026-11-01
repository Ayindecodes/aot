import catalog from "./catalog.json";

// Product types and helpers. The products themselves live in catalog.json, which the admin at
// /admin edits. Saving there commits to GitHub, and the push rebuilds and redeploys the site.
//
// availability:
//   { kind: "available" }                                   normal stock
//   { kind: "limited", remaining: 5 }                       shows "Only 5 left"; lower it after each confirmed order
//   { kind: "sold_out" }                                    stays visible, can't be ordered
//   { kind: "made_to_order" }                               custom pieces, no quantity shown
//   { kind: "custom", label: "Coming soon", orderable: false }   any other wording
//
// sizing:
//   "none"       no size needed, e.g. scarves
//   "standard"   customer picks from sizes
//   "custom"     customer enters measurements
//   "both"       customer picks a size or enters measurements
//
// Measurements are bust and length. Set measurementField: "waist" for waist and length, as on skirts.
//
// price is what the customer pays, and 0 shows "Price on request". compareAtPrice is the "before"
// price, which shows the sale.
// options is for one product sold at different prices. Set price to the lowest option.
//
// colors are the shades shown as swatches. Give a colour an image only if a recoloured photo looks
// good; without one, the customer still picks the colour but the photo stays the same. Every
// product also offers "Other", where the customer types any colour they want.

export type Availability =
  | { kind: "available" }
  | { kind: "limited"; remaining: number }
  | { kind: "sold_out" }
  | { kind: "made_to_order" }
  | { kind: "custom"; label: string; orderable: boolean };

export type Sizing = "none" | "standard" | "custom" | "both";

export type MeasurementField = "bust" | "waist";

export type Category = {
  slug: string;
  name: string;
  image?: string;
};

export type ProductColor = {
  name: string;
  hex: string;
  image?: string;
};

export type ProductOption = {
  name: string;
  price: number;
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  options?: ProductOption[];
  description: string;
  images: string[];
  sizing: Sizing;
  measurementField?: MeasurementField;
  sizes?: string[];
  colors?: ProductColor[];
  availability: Availability;
  fabric?: string;
  fit?: string;
  care?: string;
  featured?: boolean;
  addedOn: string;
};

export const categories: Category[] = [
  { slug: "abayas", name: "Abayas", image: "/products/printed-abaya-set.webp" },
  { slug: "modest-dresses", name: "Modest Dresses", image: "/products/sundress.webp" },
  {
    slug: "two-piece-sets",
    name: "Two-Piece Sets",
    image: "/products/two-piece-top-and-skirt.webp",
  },
  { slug: "modest-skirts", name: "Modest Skirts", image: "/products/handkerchief-skirt.webp" },
  { slug: "tops", name: "Tops", image: "/products/chiffon-top.webp" },
  { slug: "statement-sleeves", name: "Statement Sleeves", image: "/products/chiffon-top.webp" },
  { slug: "custom-outfits", name: "Custom Outfits", image: "/photos/custom-outfits.webp" },
  { slug: "scarves", name: "Scarves", image: "/photos/scarves.webp" },
];

export const products = catalog.products as Product[];

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}

// Only categories with real listings are shown, so nothing implies stock that doesn't exist.
export function getActiveCategories(): Category[] {
  return categories.filter((category) =>
    products.some((product) => product.category === category.slug),
  );
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const sameCategory = products.filter(
    (other) => other.slug !== product.slug && other.category === product.category,
  );
  const others = products.filter(
    (other) => other.slug !== product.slug && other.category !== product.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}
