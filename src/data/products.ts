// Product catalogue. Editing this file and redeploying updates prices, stock status and listings.
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

const comingSoon: Availability = { kind: "custom", label: "Coming soon", orderable: false };

export const products: Product[] = [
  {
    slug: "long-handkerchief-skirt",
    name: "Long Handkerchief Skirt",
    category: "modest-skirts",
    price: 15000,
    description:
      "A long handkerchief skirt in a fine striped fabric, with a tiered top layer and a full, flowing hem.",
    images: ["/products/long-handkerchief-skirt.webp"],
    sizing: "custom",
    measurementField: "waist",
    colors: [
      { name: "Pink", hex: "#efb4dc", image: "/products/long-handkerchief-skirt.webp" },
      { name: "Blue", hex: "#a9cdeb", image: "/products/long-handkerchief-skirt-blue.webp" },
      { name: "Green", hex: "#9fe3bc", image: "/products/long-handkerchief-skirt-green.webp" },
      { name: "Lilac", hex: "#c9b0ec", image: "/products/long-handkerchief-skirt-lilac.webp" },
    ],
    availability: { kind: "available" },
    featured: true,
    addedOn: "2026-10-31",
  },
  {
    slug: "maxi-satin-skirt",
    name: "Maxi Satin Skirt",
    category: "modest-skirts",
    price: 7000,
    description: "A long, fitted maxi skirt with a soft sheen that flares gently at the hem.",
    images: ["/products/maxi-satin-skirt.webp"],
    sizing: "custom",
    measurementField: "waist",
    colors: [
      { name: "Bronze", hex: "#7a5222", image: "/products/maxi-satin-skirt.webp" },
      { name: "Wine", hex: "#5a1f30", image: "/products/maxi-satin-skirt-wine.webp" },
      { name: "Green", hex: "#14583f", image: "/products/maxi-satin-skirt-green.webp" },
      { name: "Navy", hex: "#1d3461", image: "/products/maxi-satin-skirt-navy.webp" },
    ],
    availability: { kind: "available" },
    fabric: "Satin or silk",
    featured: true,
    addedOn: "2026-10-31",
  },
  {
    slug: "bubu-abaya",
    name: "Bubu Abaya",
    category: "abayas",
    price: 15000,
    description: "A loose, flowing bubu abaya with wide sleeves, shown with a matching hijab.",
    images: ["/products/bubu-abaya.webp"],
    sizing: "custom",
    colors: [
      { name: "Dusty Pink", hex: "#dcb2c0", image: "/products/bubu-abaya.webp" },
      { name: "Sage", hex: "#79d0a0", image: "/products/bubu-abaya-sage.webp" },
      { name: "Blue", hex: "#2a66ad", image: "/products/bubu-abaya-blue.webp" },
      { name: "Mocha", hex: "#a98468", image: "/products/bubu-abaya-mocha.webp" },
    ],
    availability: { kind: "available" },
    featured: true,
    addedOn: "2026-10-31",
  },
  {
    slug: "two-piece-top-and-skirt",
    name: "Two-Piece Top and Skirt",
    category: "two-piece-sets",
    price: 20000,
    description: "A two-piece set with a printed long-sleeved top and a long, flowing white skirt.",
    images: ["/products/two-piece-top-and-skirt.webp"],
    sizing: "custom",
    colors: [
      { name: "As pictured", hex: "#d9dcec" },
      { name: "Black", hex: "#1c1a1a" },
      { name: "Navy", hex: "#1f3a6b" },
      { name: "Wine", hex: "#6b1f35" },
      { name: "Green", hex: "#155a3f" },
    ],
    availability: { kind: "available" },
    featured: true,
    addedOn: "2026-10-31",
  },
  {
    slug: "naqsh-top",
    name: "Naqsh Top",
    category: "tops",
    price: 10000,
    description:
      "A long-sleeved sheer top in a leopard print, with a ruffled hem that falls longer at the sides.",
    images: ["/products/naqsh-top.webp"],
    sizing: "custom",
    colors: [
      { name: "Grey Leopard", hex: "#6f6a68", image: "/products/naqsh-top.webp" },
      { name: "Brown Leopard", hex: "#8a5a2c", image: "/products/naqsh-top-brown.webp" },
      { name: "Wine Leopard", hex: "#a0264f", image: "/products/naqsh-top-wine.webp" },
      { name: "Blue Leopard", hex: "#2f5fa8", image: "/products/naqsh-top-navy.webp" },
    ],
    availability: { kind: "available" },
    featured: true,
    addedOn: "2026-10-31",
  },
  {
    slug: "handkerchief-skirt",
    name: "Handkerchief Skirt",
    category: "modest-skirts",
    price: 15000,
    description:
      "A handkerchief skirt in a dark red and green plaid, with a tied waist and a flowing, uneven hem.",
    images: ["/products/handkerchief-skirt.webp"],
    sizing: "custom",
    measurementField: "waist",
    colors: [
      { name: "Red Plaid", hex: "#7a2e3a", image: "/products/handkerchief-skirt.webp" },
      { name: "Navy Plaid", hex: "#2f4372", image: "/products/handkerchief-skirt-navy.webp" },
      { name: "Green Plaid", hex: "#1f6b52", image: "/products/handkerchief-skirt-green.webp" },
      { name: "Brown Plaid", hex: "#5e4634", image: "/products/handkerchief-skirt-brown.webp" },
    ],
    availability: { kind: "available" },
    featured: true,
    addedOn: "2026-10-30",
  },
  {
    slug: "printed-abaya-set",
    name: "Printed Abaya Set",
    category: "abayas",
    price: 15000,
    options: [
      { name: "With scarf and inner", price: 18000 },
      { name: "With scarf, without inner", price: 15000 },
    ],
    description:
      "A 2-piece printed abaya set in a green and black animal print, with a matching scarf. Choose it with or without the inner.",
    images: ["/products/printed-abaya-set.webp"],
    sizing: "custom",
    colors: [
      { name: "Mint", hex: "#86d8bb", image: "/products/printed-abaya-set.webp" },
      { name: "Rose", hex: "#df95b4", image: "/products/printed-abaya-set-rose.webp" },
      { name: "Lilac", hex: "#a99be6", image: "/products/printed-abaya-set-lilac.webp" },
      { name: "Gold", hex: "#d9c084", image: "/products/printed-abaya-set-gold.webp" },
    ],
    availability: { kind: "available" },
    featured: true,
    addedOn: "2026-10-30",
  },
  {
    slug: "chiffon-top",
    name: "Chiffon Top",
    category: "tops",
    price: 12000,
    description:
      "A lime green chiffon top with tiered ruffles, a tie neck, a smocked waist and ruffled bell sleeves.",
    images: ["/products/chiffon-top.webp"],
    sizing: "custom",
    colors: [
      { name: "Lime", hex: "#c6e82a", image: "/products/chiffon-top.webp" },
      { name: "Rose", hex: "#c8708f", image: "/products/chiffon-top-rose.webp" },
      { name: "Teal", hex: "#2f9f96", image: "/products/chiffon-top-teal.webp" },
      { name: "Lilac", hex: "#9a80d6", image: "/products/chiffon-top-lilac.webp" },
    ],
    availability: { kind: "available" },
    fabric: "Chiffon",
    featured: true,
    addedOn: "2026-10-30",
  },
  {
    slug: "sundress",
    name: "Sundress",
    category: "modest-dresses",
    price: 16000,
    description:
      "A red and white gingham sundress with a square neckline, short puff sleeves and a full, gathered skirt.",
    images: ["/products/sundress.webp"],
    sizing: "custom",
    colors: [
      { name: "Red Gingham", hex: "#8c2f45", image: "/products/sundress.webp" },
      { name: "Navy Gingham", hex: "#34558f", image: "/products/sundress-navy.webp" },
      { name: "Green Gingham", hex: "#1f8a5e", image: "/products/sundress-green.webp" },
      { name: "Brown Gingham", hex: "#6f5344", image: "/products/sundress-brown.webp" },
    ],
    availability: { kind: "available" },
    featured: true,
    addedOn: "2026-10-30",
  },
  {
    slug: "two-tone-abaya",
    name: "Two-Tone Abaya",
    category: "abayas",
    price: 0,
    description:
      "A long open abaya with a soft blush front panel, worn with a matching hijab.",
    images: ["/products/two-tone-abaya.webp"],
    sizing: "custom",
    colors: [
      { name: "Black", hex: "#1c1a1a", image: "/products/two-tone-abaya.webp" },
      { name: "Navy", hex: "#1f3a6b", image: "/products/two-tone-abaya-navy.webp" },
      { name: "Wine", hex: "#6b1f35", image: "/products/two-tone-abaya-wine.webp" },
      { name: "Green", hex: "#155a3f", image: "/products/two-tone-abaya-green.webp" },
    ],
    availability: comingSoon,
    addedOn: "2026-10-08",
  },
  {
    slug: "hooded-abaya",
    name: "Hooded Abaya",
    category: "abayas",
    price: 0,
    description:
      "A long, loose hooded abaya with a clean, simple line.",
    images: ["/products/hooded-abaya.webp"],
    sizing: "custom",
    colors: [
      { name: "Taupe", hex: "#bdb3aa", image: "/products/hooded-abaya.webp" },
      { name: "Rose", hex: "#d795ac", image: "/products/hooded-abaya-rose.webp" },
      { name: "Sage", hex: "#9dc7a5", image: "/products/hooded-abaya-sage.webp" },
      { name: "Sky", hex: "#9dc2e0", image: "/products/hooded-abaya-sky.webp" },
    ],
    availability: comingSoon,
    addedOn: "2026-10-07",
  },
  {
    slug: "floral-dress",
    name: "Floral Dress",
    category: "modest-dresses",
    price: 0,
    description:
      "A soft floral dress with contrast sleeves and a matching hijab.",
    images: ["/products/floral-dress.webp"],
    sizing: "custom",
    colors: [
      { name: "Mocha", hex: "#a5795f", image: "/products/floral-dress.webp" },
      { name: "Rose", hex: "#b54f7b", image: "/products/floral-dress-rose.webp" },
      { name: "Sage", hex: "#6fa878", image: "/products/floral-dress-sage.webp" },
      { name: "Navy", hex: "#38598f", image: "/products/floral-dress-navy.webp" },
    ],
    availability: comingSoon,
    addedOn: "2026-10-06",
  },
  {
    slug: "tunic-trouser-set",
    name: "Tunic and Trouser Set",
    category: "two-piece-sets",
    price: 0,
    description:
      "A relaxed tunic and trousers, finished with a matching scarf.",
    images: ["/products/tunic-trouser-set.webp"],
    sizing: "custom",
    colors: [
      { name: "Beige", hex: "#c7b08f", image: "/products/tunic-trouser-set.webp" },
      { name: "Olive", hex: "#7f8a55", image: "/products/tunic-trouser-set-olive.webp" },
      { name: "Rose", hex: "#b77589", image: "/products/tunic-trouser-set-rose.webp" },
      { name: "Slate", hex: "#5f7a96", image: "/products/tunic-trouser-set-slate.webp" },
    ],
    availability: comingSoon,
    addedOn: "2026-10-05",
  },
  {
    slug: "custom-gown",
    name: "Custom Gown",
    category: "custom-outfits",
    price: 0,
    description:
      "A full-length lace gown with long sheer sleeves and a flowing skirt.",
    images: ["/products/custom-gown.webp"],
    sizing: "custom",
    colors: [
      { name: "Plum", hex: "#5c2455", image: "/products/custom-gown.webp" },
      { name: "Green", hex: "#155a3f", image: "/products/custom-gown-green.webp" },
      { name: "Navy", hex: "#1f3a6b", image: "/products/custom-gown-navy.webp" },
      { name: "Wine", hex: "#6b1f2c", image: "/products/custom-gown-wine.webp" },
    ],
    availability: comingSoon,
    addedOn: "2026-10-01",
  },
];

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
