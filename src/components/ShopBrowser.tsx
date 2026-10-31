"use client";

import { SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getActiveCategories, type Product } from "@/data/products";
import { isOrderable } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

const PAGE_SIZE = 12;

type Sort = "newest" | "price-low" | "price-high";

// Products without a price go last when sorting from low to high.
const lowPriceRank = (product: Product) => product.price || Number.MAX_SAFE_INTEGER;

const sorters: Record<Sort, (a: Product, b: Product) => number> = {
  newest: (a, b) => b.addedOn.localeCompare(a.addedOn),
  "price-low": (a, b) => lowPriceRank(a) - lowPriceRank(b),
  "price-high": (a, b) => b.price - a.price,
};

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ShopResults({
  products,
  showCategoryFilter,
  initialQuery,
  initialCategory,
}: {
  products: Product[];
  showCategoryFilter: boolean;
  initialQuery: string;
  initialCategory: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Each filter only appears when the inventory actually supports it.
  const sizes = useMemo(() => [...new Set(products.flatMap((p) => p.sizes ?? []))], [products]);
  const colors = useMemo(
    () => [...new Set(products.flatMap((p) => p.colors?.map((c) => c.name) ?? []))],
    [products],
  );
  const priceSteps = useMemo(() => {
    const prices = products.map((product) => product.price);
    const highest = Math.max(0, ...prices);
    const steps: number[] = [];
    for (let step = 10000; step < highest; step += 10000) steps.push(step);
    return steps;
  }, [products]);

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products
      .filter((product) => !search || product.name.toLowerCase().includes(search))
      .filter((product) => !category || product.category === category)
      .filter((product) => !size || product.sizes?.includes(size))
      .filter((product) => !color || product.colors?.some((option) => option.name === color))
      .filter((product) => !maxPrice || product.price <= Number(maxPrice))
      .filter((product) => !inStockOnly || isOrderable(product.availability))
      .toSorted(sorters[sort]);
  }, [products, query, category, size, color, maxPrice, inStockOnly, sort]);

  const hasFilters = Boolean(query || category || size || color || maxPrice || inStockOnly);

  function clearFilters() {
    setQuery("");
    setCategory("");
    setSize("");
    setColor("");
    setMaxPrice("");
    setInStockOnly(false);
  }

  return (
    <div className="mt-6 lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
      <div>
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
          aria-controls="shop-filters"
          className="btn btn-secondary w-full lg:hidden"
        >
          <SlidersHorizontal size={18} strokeWidth={1.5} aria-hidden="true" />
          {filtersOpen ? "Hide filters" : "Filter and sort"}
        </button>

        <div
          id="shop-filters"
          className={`mt-4 space-y-4 lg:mt-0 lg:block ${filtersOpen ? "block" : "hidden"}`}
        >
          <div>
            <label htmlFor="shop-search" className="label">
              Search
            </label>
            <input
              id="shop-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="field"
            />
          </div>
          {showCategoryFilter && (
            <FilterSelect
              id="filter-category"
              label="Category"
              value={category}
              onChange={setCategory}
              options={[
                { value: "", label: "All categories" },
                ...getActiveCategories().map((option) => ({
                  value: option.slug,
                  label: option.name,
                })),
              ]}
            />
          )}
          {sizes.length > 0 && (
            <FilterSelect
              id="filter-size"
              label="Size"
              value={size}
              onChange={setSize}
              options={[
                { value: "", label: "All sizes" },
                ...sizes.map((option) => ({ value: option, label: option })),
              ]}
            />
          )}
          {colors.length > 0 && (
            <FilterSelect
              id="filter-color"
              label="Colour"
              value={color}
              onChange={setColor}
              options={[
                { value: "", label: "All colours" },
                ...colors.map((option) => ({ value: option, label: option })),
              ]}
            />
          )}
          {priceSteps.length > 0 && (
            <FilterSelect
              id="filter-price"
              label="Price"
              value={maxPrice}
              onChange={setMaxPrice}
              options={[
                { value: "", label: "Any price" },
                ...priceSteps.map((step) => ({
                  value: String(step),
                  label: `Up to ₦${step.toLocaleString("en-NG")}`,
                })),
              ]}
            />
          )}
          <label className="flex min-h-11 items-center gap-2 text-[0.9375rem]">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
              className="h-5 w-5 accent-mocha"
            />
            Available to order only
          </label>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-10 text-sm font-medium text-mocha underline underline-offset-4"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 lg:mt-0">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted" aria-live="polite">
            {results.length} {results.length === 1 ? "piece" : "pieces"}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="shop-sort" className="text-sm text-muted">
              Sort by
            </label>
            <select
              id="shop-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              className="h-10 max-w-44 rounded-lg border border-taupe bg-white px-2 text-base lg:text-sm"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </div>
        </div>

        {results.length === 0 ? (
          <p className="mt-10 text-muted">No pieces match your search.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">
            {results.slice(0, visible).map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        )}

        {visible < results.length && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setVisible(visible + PAGE_SIZE)}
              className="btn btn-secondary"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ShopBrowser({
  products,
  showCategoryFilter = true,
}: {
  products: Product[];
  showCategoryFilter?: boolean;
}) {
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const category = params.get("category") ?? "";

  return (
    <ShopResults
      key={`${query}|${category}`}
      products={products}
      showCategoryFilter={showCategoryFilter}
      initialQuery={query}
      initialCategory={category}
    />
  );
}
