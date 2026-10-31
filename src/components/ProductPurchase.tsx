"use client";

import { Check, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/data/products";
import { useCart } from "@/lib/cart";
import { formatNaira, isOrderable } from "@/lib/catalog";
import { MAX_COLOR_LENGTH, MAX_QUANTITY, priceLine, type OrderLineInput } from "@/lib/order";
import { whatsappLink } from "@/lib/whatsapp";
import {
  emptyMeasurements,
  MeasurementFields,
  toMeasurements,
  type MeasurementValues,
} from "./MeasurementFields";

type FitMode = "size" | "measurements";

export function ProductPurchase({
  product,
  color,
  onColorChange,
}: {
  product: Product;
  color: string;
  onColorChange: (color: string) => void;
}) {
  const { add } = useCart();
  const [fit, setFit] = useState<FitMode>(product.sizing === "custom" ? "measurements" : "size");
  const [option, setOption] = useState("");
  const [size, setSize] = useState("");
  const [otherColor, setOtherColor] = useState("");
  const [usingOtherColor, setUsingOtherColor] = useState(false);
  const [measurements, setMeasurements] = useState<MeasurementValues>(emptyMeasurements);
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [added, setAdded] = useState(false);

  const orderable = isOrderable(product.availability);
  const maxQuantity =
    product.availability.kind === "limited"
      ? Math.min(product.availability.remaining, MAX_QUANTITY)
      : MAX_QUANTITY;
  const usesSizes = product.sizing === "standard" || product.sizing === "both";
  const usesMeasurements = product.sizing === "custom" || product.sizing === "both";
  const field = product.measurementField ?? "bust";

  const chosenColor = usingOtherColor ? otherColor.trim() : color;

  function handleAdd() {
    const line: OrderLineInput = {
      slug: product.slug,
      quantity,
      option: option || undefined,
      size: fit === "size" && usesSizes ? size : undefined,
      color: chosenColor || undefined,
      measurements: fit === "measurements" ? toMeasurements(measurements, field) : undefined,
    };
    const lineErrors: string[] = [];
    priceLine(line, lineErrors);
    setErrors(lineErrors);
    setAdded(lineErrors.length === 0);
    if (lineErrors.length === 0) add(line);
  }

  const whatsappMessage = `Hello AOT.ng, I'm interested in ${product.name}${chosenColor ? ` in ${chosenColor}` : ""}.`;

  const colorPicker = (
        <fieldset>
          <legend className="label">
            Colour{usingOtherColor ? ": Other" : color ? `: ${color}` : ""}
          </legend>
          <div className="flex flex-wrap items-center gap-2">
            {product.colors?.map((option) => {
              const selected = !usingOtherColor && color === option.name;
              return (
                <label
                  key={option.name}
                  title={option.name}
                  className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-mocha ${selected ? "border-mocha" : "border-transparent"}`}
                >
                  <input
                    type="radio"
                    name="color"
                    value={option.name}
                    checked={selected}
                    onChange={() => {
                      setUsingOtherColor(false);
                      onColorChange(option.name);
                    }}
                    aria-label={option.name}
                    className="sr-only"
                  />
                  <span
                    className="h-8 w-8 rounded-full border border-taupe"
                    style={{ backgroundColor: option.hex }}
                  />
                </label>
              );
            })}
            <label
                className={`flex h-11 cursor-pointer items-center rounded-full border px-4 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-mocha ${usingOtherColor ? "border-mocha bg-mocha text-ivory" : "border-taupe bg-white"}`}
              >
                <input
                  type="radio"
                  name="color"
                  value="other"
                  checked={usingOtherColor}
                  onChange={() => setUsingOtherColor(true)}
                  className="sr-only"
                />
                Other
              </label>
          </div>
          {usingOtherColor && (
            <div className="mt-3">
              <label htmlFor="other-color" className="label">
                Which colour would you like?
              </label>
              <input
                id="other-color"
                value={otherColor}
                maxLength={MAX_COLOR_LENGTH}
                onChange={(event) => setOtherColor(event.target.value)}
                placeholder="For example, wine or olive"
                className="field"
              />
            </div>
          )}
          {product.colors?.some((option) => option.image) && (
            <p className="mt-2 text-sm text-muted">
              Colour photos are previews, so the final shade may vary slightly.
            </p>
          )}
        </fieldset>
  );

  if (!orderable) {
    return (
      <div className="mt-6 space-y-5">
        {colorPicker}
        <a href={whatsappLink(whatsappMessage)} className="btn btn-secondary w-full sm:w-auto">
          Ask about this piece on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5">
      {product.options && product.options.length > 0 && (
        <fieldset>
          <legend className="label">Choose an option</legend>
          <div className="space-y-2">
            {product.options.map((candidate) => (
              <label
                key={candidate.name}
                className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-2 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-mocha ${option === candidate.name ? "border-mocha bg-mocha text-ivory" : "border-taupe bg-white"}`}
              >
                <input
                  type="radio"
                  name="option"
                  value={candidate.name}
                  checked={option === candidate.name}
                  onChange={() => setOption(candidate.name)}
                  className="sr-only"
                />
                <span>{candidate.name}</span>
                <span className="shrink-0 font-medium">{formatNaira(candidate.price)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {product.sizing === "both" && (
        <fieldset>
          <legend className="label">How would you like it sized?</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["size", "Standard size"],
                ["measurements", "My measurements"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-center text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-mocha ${fit === value ? "border-mocha bg-mocha text-ivory" : "border-taupe bg-white"}`}
              >
                <input
                  type="radio"
                  name="fit"
                  value={value}
                  checked={fit === value}
                  onChange={() => setFit(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {usesSizes && fit === "size" && (
        <fieldset>
          <legend className="label">Size</legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes?.map((option) => (
              <label
                key={option}
                className={`flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-mocha ${size === option ? "border-mocha bg-mocha text-ivory" : "border-taupe bg-white"}`}
              >
                <input
                  type="radio"
                  name="size"
                  value={option}
                  checked={size === option}
                  onChange={() => setSize(option)}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {usesMeasurements && fit === "measurements" && (
        <MeasurementFields
          idPrefix="product"
          field={field}
          values={measurements}
          onChange={setMeasurements}
        />
      )}

      {colorPicker}

      <div>
        <p id="quantity-label" className="label">
          Quantity
        </p>
        <div
          role="group"
          aria-labelledby="quantity-label"
          className="inline-flex items-center rounded-lg border border-taupe bg-white"
        >
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity(quantity - 1)}
            className="flex h-11 w-11 items-center justify-center disabled:opacity-40"
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity >= maxQuantity}
            onClick={() => setQuantity(quantity + 1)}
            className="flex h-11 w-11 items-center justify-center disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="space-y-1 text-sm text-error">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
        <button type="button" onClick={handleAdd} className="btn btn-primary">
          Add to Cart
        </button>
        <a href={whatsappLink(whatsappMessage)} className="btn btn-secondary">
          Order on WhatsApp
        </a>
      </div>

      {added && (
        <p role="status" className="flex items-center gap-2 text-sm">
          <Check size={18} className="text-mocha" aria-hidden="true" />
          Added to your cart.
          <Link href="/cart" className="font-medium text-mocha underline underline-offset-4">
            View cart
          </Link>
        </p>
      )}
    </div>
  );
}
