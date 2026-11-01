import { categories, type Availability, type Product } from "../data/products";

export type ProductResult = { ok: true; product: Product } | { ok: false; errors: string[] };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE = /^\/(?:products|photos)\/[a-z0-9-]+\.(?:webp|jpg)$/;
const HEX = /^#[0-9a-f]{6}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PRICE = 10_000_000;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function isPrice(value: unknown, min: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= MAX_PRICE;
}

function parseAvailability(value: unknown): Availability | null {
  const raw = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  switch (raw.kind) {
    case "available":
    case "sold_out":
    case "made_to_order":
      return { kind: raw.kind };
    case "limited":
      return isPrice(raw.remaining, 0) ? { kind: "limited", remaining: raw.remaining } : null;
    case "custom": {
      const label = text(raw.label, 30);
      return label ? { kind: "custom", label, orderable: raw.orderable === true } : null;
    }
    default:
      return null;
  }
}

export function validateProduct(input: unknown): ProductResult {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const errors: string[] = [];

  const slug = typeof raw.slug === "string" ? raw.slug : "";
  if (!SLUG.test(slug) || slug.length > 60) errors.push("The product needs a valid web address.");

  const name = text(raw.name, 80);
  if (!name) errors.push("Enter a product name.");

  const category = typeof raw.category === "string" ? raw.category : "";
  if (!categories.some((option) => option.slug === category)) errors.push("Choose a category.");

  if (!isPrice(raw.price, 0)) errors.push("Enter the price as a whole number of naira.");
  const price = raw.price as number;

  let compareAtPrice: number | undefined;
  if (raw.compareAtPrice !== undefined && raw.compareAtPrice !== null) {
    if (!isPrice(raw.compareAtPrice, 1) || raw.compareAtPrice <= price) {
      errors.push("The before price must be higher than the price.");
    } else {
      compareAtPrice = raw.compareAtPrice;
    }
  }

  const description = text(raw.description, 600);
  if (!description) errors.push("Enter a description.");

  const images = Array.isArray(raw.images) ? raw.images : [];
  if (images.length < 1 || images.length > 6) errors.push("Add between 1 and 6 photos.");
  if (!images.every((image) => typeof image === "string" && IMAGE.test(image))) {
    errors.push("One of the photo paths isn't valid.");
  }

  const sizing = raw.sizing;
  if (sizing !== "none" && sizing !== "standard" && sizing !== "custom" && sizing !== "both") {
    errors.push("Choose how this product is sized.");
  }

  const sizes = (Array.isArray(raw.sizes) ? raw.sizes : [])
    .map((size) => text(size, 12))
    .filter((size): size is string => Boolean(size))
    .slice(0, 12);
  if ((sizing === "standard" || sizing === "both") && sizes.length === 0) {
    errors.push("Add at least one size.");
  }

  const measurementField = raw.measurementField === "waist" ? "waist" : undefined;

  const colors: NonNullable<Product["colors"]> = [];
  for (const entry of Array.isArray(raw.colors) ? raw.colors.slice(0, 8) : []) {
    const color = (typeof entry === "object" && entry !== null ? entry : {}) as Record<string, unknown>;
    const colorName = text(color.name, 40);
    const hex = typeof color.hex === "string" && HEX.test(color.hex) ? color.hex : undefined;
    const image = typeof color.image === "string" && color.image ? color.image : undefined;
    if (!colorName || !hex) {
      errors.push("Each colour needs a name and a swatch colour.");
      continue;
    }
    if (image && !IMAGE.test(image)) {
      errors.push(`The photo for ${colorName} isn't valid.`);
      continue;
    }
    colors.push({ name: colorName, hex, ...(image ? { image } : {}) });
  }

  const options: NonNullable<Product["options"]> = [];
  for (const entry of Array.isArray(raw.options) ? raw.options.slice(0, 6) : []) {
    const option = (typeof entry === "object" && entry !== null ? entry : {}) as Record<string, unknown>;
    const optionName = text(option.name, 60);
    if (!optionName || !isPrice(option.price, 1)) {
      errors.push("Each price option needs a name and a price.");
      continue;
    }
    options.push({ name: optionName, price: option.price });
  }
  if (options.length > 0 && options.some((option) => option.price < price)) {
    errors.push("With price options, the main price must be the lowest one.");
  }

  const availability = parseAvailability(raw.availability);
  if (!availability) errors.push("Choose the stock status.");

  const addedOn = typeof raw.addedOn === "string" && DATE.test(raw.addedOn) ? raw.addedOn : "";
  if (!addedOn) errors.push("The product needs a date.");

  if (errors.length > 0 || !name || !description || !availability) return { ok: false, errors };

  const fabric = text(raw.fabric, 120);
  const fit = text(raw.fit, 200);
  const care = text(raw.care, 200);

  return {
    ok: true,
    product: {
      slug,
      name,
      category,
      price,
      ...(compareAtPrice ? { compareAtPrice } : {}),
      ...(options.length ? { options } : {}),
      description,
      images: images as string[],
      sizing: sizing as Product["sizing"],
      ...(measurementField ? { measurementField } : {}),
      ...(sizes.length ? { sizes } : {}),
      ...(colors.length ? { colors } : {}),
      availability,
      ...(fabric ? { fabric } : {}),
      ...(fit ? { fit } : {}),
      ...(care ? { care } : {}),
      ...(raw.featured === true ? { featured: true } : {}),
      addedOn,
    },
  };
}
