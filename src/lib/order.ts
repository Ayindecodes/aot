// Shared by the checkout page and the order Worker. The Worker always reprices from the
// catalogue, so nothing the browser sends can change what an order costs.

import { getDeliveryOption, type DeliveryOptionId } from "../data/business";
import { getProduct, type MeasurementField } from "../data/products";
import { availabilityLabel, isOrderable, unitPrice } from "./catalog";

export const MAX_LINES = 30;
export const MAX_QUANTITY = 20;
export const MIN_INCHES = 10;
export const MAX_INCHES = 100;
export const MAX_NOTES_LENGTH = 300;
export const MAX_COLOR_LENGTH = 40;
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
export const LAST_ORDER_KEY = "aot-last-order";

export type Measurements = {
  bust?: number;
  waist?: number;
  length: number;
  notes?: string;
};

export type OrderLineInput = {
  slug: string;
  quantity: number;
  option?: string;
  size?: string;
  color?: string;
  measurements?: Measurements;
};

export type OrderInput = {
  lines: OrderLineInput[];
  customer: { name: string; phone: string; email?: string };
  delivery: { option: string; address?: string; landmark?: string };
  policyAccepted: boolean;
};

export type PricedLine = OrderLineInput & {
  name: string;
  unitPrice: number;
  lineTotal: number;
  limited: boolean;
};

export type PricedOrder = {
  lines: PricedLine[];
  customer: { name: string; phone: string; email?: string };
  delivery: {
    option: DeliveryOptionId;
    label: string;
    fee: number | null;
    address?: string;
    landmark?: string;
  };
  subtotal: number;
  total: number;
};

export type OrderResult = { ok: true; order: PricedOrder } | { ok: false; errors: string[] };

const NIGERIAN_PHONE = /^(?:\+?234|0)[789][01]\d{8}$/;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return NIGERIAN_PHONE.test(phone.replace(/[\s-]/g, ""));
}

function text(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function parseMeasurements(value: unknown, field: MeasurementField): Measurements | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Record<string, unknown>;
  const girth = record[field];
  const { length, notes } = record;
  if (typeof girth !== "number" || typeof length !== "number") return undefined;
  if (!Number.isFinite(girth) || !Number.isFinite(length)) return undefined;
  if (girth < MIN_INCHES || girth > MAX_INCHES) return undefined;
  if (length < MIN_INCHES || length > MAX_INCHES) return undefined;
  return { [field]: girth, length, notes: text(notes, MAX_NOTES_LENGTH) };
}

export function priceLine(raw: unknown, errors: string[]): PricedLine | null {
  const line = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const product = typeof line.slug === "string" ? getProduct(line.slug) : undefined;
  if (!product) {
    errors.push("An item in your cart is no longer available.");
    return null;
  }

  const lineErrorCount = errors.length;
  const { quantity } = line;
  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_QUANTITY
  ) {
    errors.push(`${product.name}: choose a quantity from 1 to ${MAX_QUANTITY}.`);
  }

  if (!isOrderable(product.availability)) {
    errors.push(`${product.name} can't be ordered right now (${availabilityLabel(product.availability)}).`);
  }

  const option = typeof line.option === "string" && line.option ? line.option : undefined;
  if (product.options?.length) {
    if (!option) errors.push(`${product.name}: choose an option.`);
    else if (!product.options.some((candidate) => candidate.name === option)) {
      errors.push(`${product.name}: that option isn't available.`);
    }
  } else if (option) {
    errors.push(`${product.name}: that option isn't available.`);
  }

  const size = typeof line.size === "string" && line.size ? line.size : undefined;
  const field = product.measurementField ?? "bust";
  const measurements =
    line.measurements === undefined ? undefined : parseMeasurements(line.measurements, field);

  if (line.measurements !== undefined && !measurements) {
    errors.push(
      `${product.name}: enter ${field} and length in inches, from ${MIN_INCHES} to ${MAX_INCHES}.`,
    );
  } else if (product.sizing === "none" && (size || measurements)) {
    errors.push(`${product.name}: this item doesn't take a size.`);
  } else if (product.sizing === "standard" && (!size || measurements)) {
    errors.push(`${product.name}: choose a size.`);
  } else if (product.sizing === "custom" && (!measurements || size)) {
    errors.push(`${product.name}: enter your ${field} and length.`);
  } else if (product.sizing === "both" && Boolean(size) === Boolean(measurements)) {
    errors.push(`${product.name}: choose a size or enter your measurements.`);
  }
  if (size && !product.sizes?.includes(size)) {
    errors.push(`${product.name}: size ${size} isn't available.`);
  }

  const color = text(line.color, MAX_COLOR_LENGTH);
  if (product.colors?.length && !color) errors.push(`${product.name}: choose a colour.`);

  if (errors.length > lineErrorCount) return null;

  const price = unitPrice(product, option);
  return {
    slug: product.slug,
    name: product.name,
    quantity: quantity as number,
    option,
    size,
    color,
    measurements,
    unitPrice: price,
    lineTotal: price * (quantity as number),
    limited: product.availability.kind === "limited",
  };
}

export function priceLines(rawLines: unknown[], errors: string[]): PricedLine[] {
  if (rawLines.length === 0) errors.push("Your cart is empty.");
  if (rawLines.length > MAX_LINES) errors.push(`An order can have up to ${MAX_LINES} items.`);

  const lines: PricedLine[] = [];
  for (const rawLine of rawLines.slice(0, MAX_LINES)) {
    const line = priceLine(rawLine, errors);
    if (line) lines.push(line);
  }

  // One product can sit on several lines, so limited stock is checked per product.
  const quantityBySlug = new Map<string, number>();
  for (const line of lines) {
    quantityBySlug.set(line.slug, (quantityBySlug.get(line.slug) ?? 0) + line.quantity);
  }
  for (const [slug, quantity] of quantityBySlug) {
    const product = getProduct(slug);
    if (product?.availability.kind === "limited" && quantity > product.availability.remaining) {
      errors.push(`Only ${product.availability.remaining} of ${product.name} left.`);
    }
  }

  return lines;
}

export function priceOrder(input: unknown, route: "pay" | "whatsapp"): OrderResult {
  const errors: string[] = [];
  const raw = (typeof input === "object" && input !== null ? input : {}) as Partial<OrderInput>;

  const lines = priceLines(Array.isArray(raw.lines) ? raw.lines : [], errors);

  const name = text(raw.customer?.name, 100);
  if (!name) errors.push("Enter your full name.");

  const phone = text(raw.customer?.phone, 20);
  if (!phone || !isValidPhone(phone)) errors.push("Enter a valid Nigerian phone number.");

  // Order updates go by email, so paying on the site needs an address. WhatsApp orders don't.
  const email = route === "pay" ? text(raw.customer?.email, 254) : undefined;
  if (route === "pay" && (!email || !isValidEmail(email))) {
    errors.push("Enter a valid email address, so we can send you order updates.");
  }

  const option = getDeliveryOption(typeof raw.delivery?.option === "string" ? raw.delivery.option : "");
  const address = text(raw.delivery?.address, 300);
  const landmark = text(raw.delivery?.landmark, 150);
  if (!option) {
    errors.push("Choose a delivery option.");
  } else {
    if (option.requiresAddress && !address) errors.push("Enter your delivery address.");
    if (option.fee === null && route === "pay") {
      errors.push("Orders outside Ilorin are arranged on WhatsApp.");
    }
  }

  if (raw.policyAccepted !== true) errors.push("Accept the returns and adjustments policy.");

  if (errors.length > 0 || !option || !name || !phone) return { ok: false, errors };

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  return {
    ok: true,
    order: {
      lines,
      customer: { name, phone: phone.replace(/[\s-]/g, ""), email },
      delivery: {
        option: option.id,
        label: option.label,
        fee: option.fee,
        address: option.requiresAddress ? address : undefined,
        landmark: option.requiresAddress ? landmark : undefined,
      },
      subtotal,
      total: subtotal + (option.fee ?? 0),
    },
  };
}

export function describeLineOptions(line: OrderLineInput): string {
  const parts: string[] = [];
  if (line.option) parts.push(line.option);
  if (line.size) parts.push(`Size ${line.size}`);
  if (line.color) parts.push(line.color);
  if (line.measurements) {
    const { bust, waist, length, notes } = line.measurements;
    const girth = bust === undefined ? `Waist ${waist} in` : `Bust ${bust} in`;
    parts.push(`${girth}, length ${length} in`);
    if (notes) parts.push(`Notes: ${notes}`);
  }
  return parts.join(", ");
}
