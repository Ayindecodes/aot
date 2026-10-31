import type { Product } from "../data/products";

// Made-up products that cover every sizing and stock case, so tests don't depend on the real catalogue.
const sizes = ["S", "M", "L", "XL"];
const colors = [
  { name: "Espresso", hex: "#382319" },
  { name: "Cream", hex: "#efe4d7" },
];
const base = { category: "abayas", description: "Test product.", images: [], addedOn: "2026-10-01" };

export const testProducts: Product[] = [
  {
    ...base,
    slug: "test-abaya-one",
    name: "Test Abaya One",
    price: 10000,
    compareAtPrice: 15000,
    sizing: "both",
    sizes,
    colors,
    availability: { kind: "available" },
  },
  {
    ...base,
    slug: "test-abaya-two",
    name: "Test Abaya Two",
    price: 12000,
    sizing: "standard",
    sizes,
    availability: { kind: "limited", remaining: 5 },
  },
  {
    ...base,
    slug: "test-dress-one",
    name: "Test Dress One",
    price: 14000,
    sizing: "standard",
    sizes,
    colors,
    availability: { kind: "sold_out" },
  },
  {
    ...base,
    slug: "test-skirt-one",
    name: "Test Skirt One",
    price: 9000,
    sizing: "standard",
    sizes,
    availability: { kind: "custom", label: "Coming soon", orderable: false },
  },
  {
    ...base,
    slug: "test-scarf-one",
    name: "Test Scarf One",
    price: 5000,
    sizing: "none",
    colors,
    availability: { kind: "limited", remaining: 5 },
  },
  {
    ...base,
    slug: "test-custom-outfit",
    name: "Test Custom Outfit",
    price: 25000,
    sizing: "custom",
    availability: { kind: "made_to_order" },
  },
];
