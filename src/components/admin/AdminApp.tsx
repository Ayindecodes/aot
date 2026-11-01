"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getCategory, type Product } from "@/data/products";
import { availabilityLabel, formatNaira } from "@/lib/catalog";
import { BotCheck } from "../BotCheck";
import { ProductForm, type SaveRequest } from "./ProductForm";

type Screen = "loading" | "closed" | "login" | "list" | "form";

async function send(path: string, body: unknown) {
  const response = await fetch(`/api/admin/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => null)) as { errors?: string[] } | null;
  return { ok: response.ok, status: response.status, errors: data?.errors ?? [] };
}

export function AdminApp() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [products, setProducts] = useState<Product[]>([]);
  const [sha, setSha] = useState("");
  const [editing, setEditing] = useState<Product | undefined>();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/catalog");
    if (response.status === 503) return setScreen("closed");
    if (response.status === 401) return setScreen("login");
    if (!response.ok) {
      setErrors(["The products couldn't be loaded. Refresh to try again."]);
      return setScreen("list");
    }
    const data = (await response.json()) as { sha: string; products: Product[] };
    setProducts(data.products);
    setSha(data.sha);
    setErrors([]);
    setScreen("list");
  }, []);

  useEffect(() => {
    // Loading is an async call to the Worker, so state only changes once it answers.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const result = await send("login", { password, token });
    setSaving(false);
    if (!result.ok) {
      setErrors(result.errors);
      setToken("");
      setAttempt(attempt + 1);
      return;
    }
    setPassword("");
    setErrors([]);
    await load();
  }

  async function logout() {
    await send("logout", {});
    setScreen("login");
  }

  async function save(request: SaveRequest) {
    setSaving(true);
    setErrors([]);
    const result = await send("save", { ...request, catalogSha: sha });
    setSaving(false);
    if (result.status === 401) return setScreen("login");
    if (!result.ok) return setErrors(result.errors);
    setNotice("Saved. The change will be live in about 3 minutes.");
    await load();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  async function remove(product: Product) {
    if (!window.confirm(`Remove ${product.name} and its photos from the site?`)) return;
    setErrors([]);
    const result = await send("delete", { slug: product.slug, catalogSha: sha });
    if (result.status === 401) return setScreen("login");
    if (!result.ok) return setErrors(result.errors);
    setNotice(`${product.name} removed. It will disappear in about 3 minutes.`);
    await load();
  }

  if (screen === "loading") return <p className="text-muted">Loading...</p>;

  if (screen === "closed") {
    return <p className="text-muted">The admin isn&apos;t set up yet.</p>;
  }

  if (screen === "login") {
    return (
      <form onSubmit={login} className="max-w-sm space-y-4">
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field"
          />
        </div>
        <BotCheck key={attempt} onToken={setToken} onError={() => {}} />
        {errors.length > 0 && (
          <p role="alert" className="text-sm text-error">
            {errors[0]}
          </p>
        )}
        <button type="submit" disabled={saving || !token} className="btn btn-primary w-full">
          {saving ? "Logging in..." : "Log In"}
        </button>
      </form>
    );
  }

  if (screen === "form") {
    return (
      <ProductForm
        key={editing?.slug ?? "new"}
        product={editing}
        saving={saving}
        errors={errors}
        onSave={save}
        onCancel={() => {
          setErrors([]);
          setScreen("list");
        }}
      />
    );
  }

  const term = search.trim().toLowerCase();
  const visible = products.filter((product) => !term || product.name.toLowerCase().includes(term));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditing(undefined);
            setNotice("");
            setErrors([]);
            setScreen("form");
          }}
        >
          Add a Product
        </button>
        <button type="button" onClick={logout} className="min-h-10 text-sm text-mocha underline underline-offset-4">
          Log out
        </button>
      </div>

      {notice && (
        <p role="status" className="mt-4 rounded-lg bg-cream p-3">
          {notice}
        </p>
      )}
      {errors.length > 0 && (
        <p role="alert" className="mt-4 rounded-lg bg-white p-3 text-sm text-error">
          {errors[0]}
        </p>
      )}

      <div className="mt-6">
        <label htmlFor="admin-search" className="label">
          Search {products.length} products
        </label>
        <input
          id="admin-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="field"
        />
      </div>

      <ul className="mt-4 divide-y divide-cream border-y border-cream">
        {visible.map((product) => (
          <li key={product.slug} className="flex items-center gap-3 py-3">
            {/* Photos saved moments ago may not be live yet, so a broken image is expected briefly. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.images[0]}
              alt=""
              loading="lazy"
              className="aspect-[3/4] w-14 shrink-0 rounded bg-cream object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted">
                {product.price ? formatNaira(product.price) : "Price on request"} ·{" "}
                {getCategory(product.category)?.name} · {availabilityLabel(product.availability)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col sm:flex-row sm:gap-3">
              <button
                type="button"
                aria-label={`Edit ${product.name}`}
                className="min-h-10 text-sm font-medium text-mocha underline underline-offset-4"
                onClick={() => {
                  setEditing(product);
                  setNotice("");
                  setErrors([]);
                  setScreen("form");
                }}
              >
                Edit
              </button>
              <button
                type="button"
                aria-label={`Remove ${product.name}`}
                className="min-h-10 text-sm text-error underline underline-offset-4"
                onClick={() => remove(product)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
