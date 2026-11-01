"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { categories, type Availability, type Product } from "@/data/products";
import type { PreparedImage } from "@/lib/admin-image";
import { slugify } from "@/lib/product-validation";
import { PhotoPicker } from "./PhotoPicker";

type Stock = "available" | "limited" | "sold_out" | "made_to_order" | "coming_soon" | "custom";
type ColorRow = { key: number; name: string; hex: string; image?: string; upload?: PreparedImage };
type OptionRow = { key: number; name: string; price: string };
type Upload = { path: string; base64: string };

export type SaveRequest = { product: unknown; uploads: Upload[]; originalSlug?: string };

function stockOf(availability?: Availability): Stock {
  if (!availability) return "available";
  if (availability.kind === "custom") {
    return availability.label === "Coming soon" && !availability.orderable ? "coming_soon" : "custom";
  }
  return availability.kind;
}

export function ProductForm({
  product,
  saving,
  errors,
  onSave,
  onCancel,
}: {
  product?: Product;
  saving: boolean;
  errors: string[];
  onSave: (request: SaveRequest) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? categories[0].slug);
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [before, setBefore] = useState(product?.compareAtPrice ? String(product.compareAtPrice) : "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [fabric, setFabric] = useState(product?.fabric ?? "");
  const [sizing, setSizing] = useState<Product["sizing"]>(product?.sizing ?? "custom");
  const [field, setField] = useState(product?.measurementField ?? "bust");
  const [sizes, setSizes] = useState(product?.sizes?.join(", ") ?? "");
  const [stock, setStock] = useState<Stock>(stockOf(product?.availability));
  const [remaining, setRemaining] = useState(
    product?.availability.kind === "limited" ? String(product.availability.remaining) : "5",
  );
  const [label, setLabel] = useState(
    product?.availability.kind === "custom" ? product.availability.label : "",
  );
  const [orderable, setOrderable] = useState(
    product?.availability.kind === "custom" ? product.availability.orderable : false,
  );
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [photo, setPhoto] = useState<PreparedImage | null>(null);
  const [colors, setColors] = useState<ColorRow[]>(
    (product?.colors ?? []).map((color, key) => ({ ...color, key })),
  );
  const [options, setOptions] = useState<OptionRow[]>(
    (product?.options ?? []).map((option, key) => ({ key, name: option.name, price: String(option.price) })),
  );
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  const usesSizes = sizing === "standard" || sizing === "both";
  const usesMeasurements = sizing === "custom" || sizing === "both";

  function availability(): Availability {
    switch (stock) {
      case "limited":
        return { kind: "limited", remaining: Number(remaining) };
      case "coming_soon":
        return { kind: "custom", label: "Coming soon", orderable: false };
      case "custom":
        return { kind: "custom", label, orderable };
      default:
        return { kind: stock };
    }
  }

  function updateColor(key: number, changes: Partial<ColorRow>) {
    setColors(colors.map((color) => (color.key === key ? { ...color, ...changes } : color)));
  }

  function updateOption(key: number, changes: Partial<OptionRow>) {
    setOptions(options.map((option) => (option.key === key ? { ...option, ...changes } : option)));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const slug = product?.slug ?? slugify(name);
    if (!product && !photo) {
      setLocalErrors(["Add a photo."]);
      return;
    }
    setLocalErrors([]);

    const stamp = Date.now().toString(36);
    const uploads: Upload[] = [];
    const place = (image: PreparedImage, suffix: string) => {
      const file = `${slug}-${stamp}${suffix}.${image.extension}`;
      uploads.push({ path: `public/products/${file}`, base64: image.base64 });
      return `/products/${file}`;
    };

    const main = photo ? place(photo, "") : product?.images[0];
    const images = [main, ...(product?.images.slice(1) ?? [])];
    const oldMain = product?.images[0];

    onSave({
      originalSlug: product?.slug,
      uploads,
      product: {
        slug,
        name,
        category,
        price: Number(price),
        compareAtPrice: before ? Number(before) : undefined,
        description,
        fabric,
        sizing,
        measurementField: usesMeasurements && field === "waist" ? "waist" : undefined,
        sizes: usesSizes ? sizes.split(",") : [],
        availability: availability(),
        featured,
        images,
        addedOn: product?.addedOn ?? new Date().toISOString().slice(0, 10),
        colors: colors.map((color, index) => {
          let image = color.image;
          if (color.upload) image = place(color.upload, `-${index}`);
          else if (photo && image === oldMain) image = main;
          return { name: color.name, hex: color.hex, ...(image ? { image } : {}) };
        }),
        options: options.map((option) => ({ name: option.name, price: Number(option.price) })),
      },
    });
  }

  const shownErrors = [...localErrors, ...errors];

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <h2 className="text-3xl">{product ? `Edit ${product.name}` : "Add a Product"}</h2>

      <div>
        <label htmlFor="name" className="label">
          Product name
        </label>
        <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="field" />
      </div>

      <PhotoPicker
        id="main-photo"
        label={product ? "Replace the photo (optional)" : "Photo"}
        current={product?.images[0]}
        onChange={(image) => {
          setPhoto(image);
          setLocalErrors([]);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="label">
            Price (₦)
          </label>
          <input
            id="price"
            type="number"
            inputMode="numeric"
            min={0}
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="field"
          />
          <p className="mt-1 text-sm text-muted">Enter 0 to show Price on request.</p>
        </div>
        <div>
          <label htmlFor="before" className="label">
            Before price (₦, optional)
          </label>
          <input
            id="before"
            type="number"
            inputMode="numeric"
            min={0}
            value={before}
            onChange={(e) => setBefore(e.target.value)}
            className="field"
          />
          <p className="mt-1 text-sm text-muted">Shows the item as on sale.</p>
        </div>
      </div>

      <div>
        <label htmlFor="category" className="label">
          Category
        </label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="field">
          {categories.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          required
          rows={3}
          maxLength={600}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="field"
        />
      </div>

      <div>
        <label htmlFor="fabric" className="label">
          Fabric (optional)
        </label>
        <input id="fabric" value={fabric} onChange={(e) => setFabric(e.target.value)} className="field" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sizing" className="label">
            Sizing
          </label>
          <select
            id="sizing"
            value={sizing}
            onChange={(e) => setSizing(e.target.value as Product["sizing"])}
            className="field"
          >
            <option value="custom">Customer enters measurements</option>
            <option value="standard">Customer picks a size</option>
            <option value="both">Size or measurements</option>
            <option value="none">No size needed</option>
          </select>
        </div>
        {usesMeasurements && (
          <div>
            <label htmlFor="field" className="label">
              Measurements
            </label>
            <select
              id="field"
              value={field}
              onChange={(e) => setField(e.target.value as "bust" | "waist")}
              className="field"
            >
              <option value="bust">Bust and length</option>
              <option value="waist">Waist and length</option>
            </select>
          </div>
        )}
      </div>

      {usesSizes && (
        <div>
          <label htmlFor="sizes" className="label">
            Sizes, separated by commas
          </label>
          <input
            id="sizes"
            value={sizes}
            onChange={(e) => setSizes(e.target.value)}
            placeholder="S, M, L, XL"
            className="field"
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="stock" className="label">
            Stock status
          </label>
          <select id="stock" value={stock} onChange={(e) => setStock(e.target.value as Stock)} className="field">
            <option value="available">Available</option>
            <option value="limited">Limited, show how many are left</option>
            <option value="made_to_order">Made to order</option>
            <option value="sold_out">Sold out</option>
            <option value="coming_soon">Coming soon</option>
            <option value="custom">Other wording</option>
          </select>
        </div>
        {stock === "limited" && (
          <div>
            <label htmlFor="remaining" className="label">
              How many are left?
            </label>
            <input
              id="remaining"
              type="number"
              inputMode="numeric"
              min={0}
              value={remaining}
              onChange={(e) => setRemaining(e.target.value)}
              className="field"
            />
          </div>
        )}
        {stock === "custom" && (
          <div>
            <label htmlFor="label" className="label">
              Wording
            </label>
            <input id="label" value={label} onChange={(e) => setLabel(e.target.value)} className="field" />
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={orderable}
                onChange={(e) => setOrderable(e.target.checked)}
                className="h-5 w-5 accent-mocha"
              />
              Customers can order it
            </label>
          </div>
        )}
      </div>

      <fieldset className="space-y-3">
        <legend className="label">Colours (optional)</legend>
        <p className="text-sm text-muted">
          A photo for a colour is optional. Without one, customers still pick the colour. Every
          product also offers Other, for any colour.
        </p>
        {colors.map((color, index) => (
          <div key={color.key} className="space-y-3 rounded-lg bg-cream p-3">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <label htmlFor={`color-${color.key}`} className="label">
                  Colour {index + 1}
                </label>
                <input
                  id={`color-${color.key}`}
                  required
                  value={color.name}
                  onChange={(e) => updateColor(color.key, { name: e.target.value })}
                  className="field"
                />
              </div>
              <input
                type="color"
                aria-label={`Swatch for colour ${index + 1}`}
                value={color.hex}
                onChange={(e) => updateColor(color.key, { hex: e.target.value })}
                className="h-12 w-12 shrink-0 rounded border border-taupe bg-white"
              />
              <button
                type="button"
                aria-label={`Remove colour ${index + 1}`}
                onClick={() => setColors(colors.filter((entry) => entry.key !== color.key))}
                className="flex h-12 w-11 shrink-0 items-center justify-center text-muted"
              >
                <Trash2 size={18} strokeWidth={1.5} />
              </button>
            </div>
            <PhotoPicker
              id={`color-photo-${color.key}`}
              label="Photo in this colour (optional)"
              current={color.image}
              onChange={(image) => updateColor(color.key, { upload: image ?? undefined })}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setColors([...colors, { key: Date.now(), name: "", hex: "#694634" }])}
          className="btn btn-secondary"
        >
          <Plus size={16} aria-hidden="true" /> Add a colour
        </button>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="label">Price options (optional)</legend>
        <p className="text-sm text-muted">
          For one product sold at different prices. Set the main price to the lowest option.
        </p>
        {options.map((option, index) => (
          <div key={option.key} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor={`option-${option.key}`} className="label">
                Option {index + 1}
              </label>
              <input
                id={`option-${option.key}`}
                required
                value={option.name}
                onChange={(e) => updateOption(option.key, { name: e.target.value })}
                className="field"
              />
            </div>
            <div className="w-28 shrink-0">
              <label htmlFor={`option-price-${option.key}`} className="label">
                Price (₦)
              </label>
              <input
                id={`option-price-${option.key}`}
                type="number"
                inputMode="numeric"
                min={1}
                required
                value={option.price}
                onChange={(e) => updateOption(option.key, { price: e.target.value })}
                className="field"
              />
            </div>
            <button
              type="button"
              aria-label={`Remove option ${index + 1}`}
              onClick={() => setOptions(options.filter((entry) => entry.key !== option.key))}
              className="flex h-12 w-11 shrink-0 items-center justify-center text-muted"
            >
              <Trash2 size={18} strokeWidth={1.5} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOptions([...options, { key: Date.now(), name: "", price: "" }])}
          className="btn btn-secondary"
        >
          <Plus size={16} aria-hidden="true" /> Add a price option
        </button>
      </fieldset>

      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="h-5 w-5 accent-mocha"
        />
        Show on the homepage
      </label>

      {shownErrors.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-lg bg-white p-4 text-sm text-error">
          {shownErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Saving..." : "Save Product"}
        </button>
        <button type="button" disabled={saving} onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
