"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getProduct, type Product } from "@/data/products";
import { useCart, useHydrated, type CartLine } from "@/lib/cart";
import { availabilityLabel, formatNaira, imageFor, isOrderable, unitPrice } from "@/lib/catalog";
import { MAX_QUANTITY, priceLines } from "@/lib/order";
import {
  emptyMeasurements,
  MeasurementFields,
  toMeasurements,
  type MeasurementValues,
} from "./MeasurementFields";
import { ProductImage } from "./ProductImage";

function MeasurementEditor({ line, product }: { line: CartLine; product: Product }) {
  const { update } = useCart();
  const field = product.measurementField ?? "bust";
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<MeasurementValues>(emptyMeasurements);

  if (!line.measurements) return null;
  const { length, notes } = line.measurements;
  const girth = line.measurements[field];

  if (!editing) {
    return (
      <div className="mt-1 text-sm text-muted">
        <p>
          {field === "waist" ? "Waist" : "Bust"} {girth} in, length {length} in
        </p>
        {notes && <p>Notes: {notes}</p>}
        <button
          type="button"
          onClick={() => {
            setValues({ girth: String(girth), length: String(length), notes: notes ?? "" });
            setEditing(true);
          }}
          className="inline-flex min-h-10 items-center font-medium text-mocha underline underline-offset-4"
        >
          Edit measurements
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <MeasurementFields
        idPrefix={`cart-${line.id}`}
        field={field}
        values={values}
        onChange={setValues}
      />
      <button
        type="button"
        onClick={() => update(line.id, { measurements: toMeasurements(values, field) })}
        className="btn btn-secondary mt-2"
      >
        Save measurements
      </button>
    </div>
  );
}

function CartRow({ line, product }: { line: CartLine; product: Product }) {
  const { update, remove } = useCart();
  const price = unitPrice(product, line.option);

  return (
    <li className="flex gap-4 border-b border-cream py-5">
      <Link href={`/product/${product.slug}`} className="w-20 shrink-0 overflow-hidden rounded-lg sm:w-24">
        <ProductImage product={product} src={imageFor(product, line.color)} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/product/${product.slug}`} className="font-serif text-xl hover:text-mocha">
              {product.name}
            </Link>
            <p className="text-sm text-muted">{formatNaira(price)} each</p>
            {!isOrderable(product.availability) && (
              <p className="text-sm font-medium text-error">
                {availabilityLabel(product.availability)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => remove(line.id)}
            aria-label={`Remove ${product.name}`}
            className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center text-muted hover:text-error"
          >
            <Trash2 size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {line.option && product.options && (
            <label className="max-w-full min-w-0 text-base md:text-sm">
              <span className="sr-only">Option for {product.name}</span>
              <select
                value={line.option}
                onChange={(event) => update(line.id, { option: event.target.value })}
                className="h-11 w-full max-w-full rounded-lg border border-taupe bg-white px-2"
              >
                {product.options.map((option) => (
                  <option key={option.name} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {line.size && product.sizes && (
            <label className="max-w-full min-w-0 text-base md:text-sm">
              <span className="sr-only">Size for {product.name}</span>
              <select
                value={line.size}
                onChange={(event) => update(line.id, { size: event.target.value })}
                className="h-11 w-full max-w-full rounded-lg border border-taupe bg-white px-2"
              >
                {product.sizes.map((size) => (
                  <option key={size} value={size}>
                    Size {size}
                  </option>
                ))}
              </select>
            </label>
          )}
          {line.color && product.colors && (
            <label className="max-w-full min-w-0 text-base md:text-sm">
              <span className="sr-only">Colour for {product.name}</span>
              <select
                value={line.color}
                onChange={(event) => update(line.id, { color: event.target.value })}
                className="h-11 w-full max-w-full rounded-lg border border-taupe bg-white px-2"
              >
                {!product.colors.some((color) => color.name === line.color) && (
                  <option value={line.color}>{line.color}</option>
                )}
                {product.colors.map((color) => (
                  <option key={color.name} value={color.name}>
                    {color.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <MeasurementEditor key={line.id} line={line} product={product} />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-lg border border-taupe bg-white">
            <button
              type="button"
              aria-label={`Decrease quantity of ${product.name}`}
              disabled={line.quantity <= 1}
              onClick={() => update(line.id, { quantity: line.quantity - 1 })}
              className="flex h-11 w-11 items-center justify-center disabled:opacity-40"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center" aria-live="polite">
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label={`Increase quantity of ${product.name}`}
              disabled={line.quantity >= MAX_QUANTITY}
              onClick={() => update(line.id, { quantity: line.quantity + 1 })}
              className="flex h-11 w-11 items-center justify-center disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>
          <p className="font-medium">{formatNaira(price * line.quantity)}</p>
        </div>
      </div>
    </li>
  );
}

export function CartView() {
  const hydrated = useHydrated();
  const { lines } = useCart();

  if (!hydrated) return <p className="mt-8 text-muted">Loading your cart...</p>;

  if (lines.length === 0) {
    return (
      <div className="mt-8">
        <p className="text-muted">Your cart is empty.</p>
        <Link href="/shop" className="btn btn-primary mt-5">
          Shop the Collection
        </Link>
      </div>
    );
  }

  const errors: string[] = [];
  priceLines(lines, errors);
  const subtotal = lines.reduce((sum, line) => {
    const product = getProduct(line.slug);
    return sum + (product ? unitPrice(product, line.option) * line.quantity : 0);
  }, 0);

  return (
    <div className="mt-6 lg:grid lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-12">
      <ul className="border-t border-cream">
        {lines.map((line) => {
          const product = getProduct(line.slug);
          return product ? <CartRow key={line.id} line={line} product={product} /> : null;
        })}
      </ul>

      <aside className="mt-8 rounded-lg bg-white p-6 lg:mt-0">
        <h2 className="text-2xl">Order Summary</h2>
        <div className="mt-4 flex justify-between">
          <span>Subtotal</span>
          <span className="font-medium">{formatNaira(subtotal)}</span>
        </div>
        <p className="mt-1 text-sm text-muted">Delivery is added at checkout.</p>
        {errors.length > 0 && (
          <ul role="alert" className="mt-4 space-y-1 text-sm text-error">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
        {errors.length > 0 ? (
          <button type="button" disabled className="btn btn-primary mt-5 w-full">
            Proceed to Checkout
          </button>
        ) : (
          <Link href="/checkout" className="btn btn-primary mt-5 w-full">
            Proceed to Checkout
          </Link>
        )}
        <Link
          href="/shop"
          className="mt-2 flex min-h-11 items-center justify-center text-sm font-medium text-mocha underline underline-offset-4"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
