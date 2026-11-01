import { Buffer } from "node:buffer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateProduct } from "../src/lib/product-validation";
import worker, { type Env } from "./index";
import { isValidSession } from "./admin";

const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBPVP8 ")]).toString("base64");
const BASE = "https://aotwears.store/api/admin/";

const existing = (slug: string, images: string[], extra = {}) => ({
  slug,
  name: slug,
  category: "abayas",
  price: 1000,
  description: "Text",
  images,
  sizing: "custom",
  availability: { kind: "available" },
  addedOn: "2026-10-01",
  ...extra,
});

const newProduct = (overrides = {}) => ({
  slug: "new-dress",
  name: "New Dress",
  category: "modest-dresses",
  price: 9000,
  description: "A new dress.",
  images: ["/products/new-dress-a.webp"],
  sizing: "custom",
  availability: { kind: "available" },
  addedOn: "2026-11-01",
  ...overrides,
});

function env(overrides: Partial<Env> = {}): Env {
  return {
    ASSETS: { fetch: vi.fn(async () => new Response("asset")) },
    ORDER_ALERT_EMAIL: "owner@example.com",
    ORDER_FROM_EMAIL: "Orders <orders@example.com>",
    TURNSTILE_SECRET_KEY: "turnstile-secret",
    ADMIN_PASSWORD: "correct horse battery",
    ADMIN_SESSION_SECRET: "session-secret",
    GITHUB_TOKEN: "github-token",
    GITHUB_REPO: "Ayindecodes/aot",
    ...overrides,
  };
}

describe("admin", () => {
  const github = vi.fn();
  const botCheck = vi.fn();
  let catalog: unknown[];
  let tree: { path: string; sha: string | null }[];
  let commitMessage: string;

  beforeEach(() => {
    catalog = [
      existing("first", ["/products/first.webp"]),
      existing("second", ["/products/second.webp", "/products/shared.webp"]),
      existing("third", ["/products/third.webp", "/products/shared.webp"], {
        colors: [{ name: "Red", hex: "#ff0000", image: "/products/third-red.webp" }],
      }),
    ];
    tree = [];
    commitMessage = "";
    botCheck.mockReset().mockImplementation(async () => Response.json({ success: true }));
    github.mockReset().mockImplementation(async (url: string, init?: RequestInit) => {
      const path = url.replace("https://api.github.com/repos/Ayindecodes/aot", "");
      const body = init?.body ? JSON.parse(init.body as string) : {};
      if (path.startsWith("/contents/")) {
        const content = Buffer.from(JSON.stringify({ products: catalog })).toString("base64");
        return Response.json({ sha: "catalog-sha", content });
      }
      if (path.startsWith("/git/ref/")) return Response.json({ object: { sha: "head" } });
      if (path === "/git/commits/head") return Response.json({ tree: { sha: "tree" } });
      if (path === "/git/blobs") return Response.json({ sha: "blob" });
      if (path === "/git/trees") {
        tree = body.tree;
        return Response.json({ sha: "new-tree" });
      }
      if (path === "/git/commits") {
        commitMessage = body.message;
        return Response.json({ sha: "new-commit" });
      }
      if (path.startsWith("/git/refs/")) return Response.json({});
      throw new Error(`Unexpected GitHub call: ${path}`);
    });
    vi.stubGlobal("fetch", (url: string, init: RequestInit) =>
      url.includes("siteverify") ? botCheck(url, init) : github(url, init),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const post = (path: string, body: unknown, headers: Record<string, string> = {}, testEnv = env()) =>
    worker.fetch(
      new Request(`${BASE}${path}`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { origin: "https://aotwears.store", ...headers },
      }),
      testEnv,
    );

  async function session() {
    const response = await post("login", { password: "correct horse battery", token: "t" });
    expect(response.status).toBe(200);
    return { cookie: (response.headers.get("set-cookie") ?? "").split(";")[0] };
  }

  const saved = () => {
    const file = github.mock.calls.find(
      ([url, init]) => url.endsWith("/git/blobs") && String(init.body).includes("products"),
    );
    return JSON.parse(JSON.parse(file?.[1].body).content).products;
  };

  it("stays shut with no password set", async () => {
    const response = await post("login", { password: "", token: "t" }, {}, env({ ADMIN_PASSWORD: undefined }));
    expect(response.status).toBe(503);
  });

  it("logs in with the right password and a secure cookie", async () => {
    const response = await post("login", { password: "correct horse battery", token: "t" });
    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie") ?? "";
    for (const flag of ["HttpOnly", "Secure", "SameSite=Strict", "Path=/api/admin"]) {
      expect(cookie).toContain(flag);
    }
  });

  it("refuses a wrong password, or a failed bot check", async () => {
    expect((await post("login", { password: "wrong", token: "t" })).status).toBe(401);
    botCheck.mockImplementation(async () => Response.json({ success: false }));
    expect((await post("login", { password: "correct horse battery", token: "t" })).status).toBe(403);
  });

  it("refuses everything without a valid session", async () => {
    const read = await worker.fetch(new Request(`${BASE}catalog`), env());
    expect(read.status).toBe(401);
    const forged = await post("save", { product: newProduct() }, { cookie: "aot_admin=9999999999.forged" });
    expect(forged.status).toBe(401);
    expect(github).not.toHaveBeenCalled();
  });

  it("expires sessions after 12 hours", async () => {
    const { cookie } = await session();
    const value = cookie.split("=")[1];
    expect(await isValidSession("session-secret", value)).toBe(true);
    expect(await isValidSession("session-secret", value, Date.now() + 13 * 3600 * 1000)).toBe(false);
    expect(await isValidSession("other-secret", value)).toBe(false);
  });

  it("refuses requests from other sites, and with no origin", async () => {
    const { cookie } = await session();
    const foreign = await post("save", {}, { cookie, origin: "https://evil.example" });
    expect(foreign.status).toBe(403);
    const noOrigin = await worker.fetch(
      new Request(`${BASE}save`, { method: "POST", body: "{}", headers: { cookie } }),
      env(),
    );
    expect(noOrigin.status).toBe(403);
  });

  it("adds a new product first, with its photo in one commit", async () => {
    const { cookie } = await session();
    const response = await post(
      "save",
      {
        product: newProduct(),
        uploads: [{ path: "public/products/new-dress-a.webp", base64: WEBP }],
        catalogSha: "catalog-sha",
      },
      { cookie },
    );
    expect(response.status).toBe(200);
    expect(commitMessage).toBe("Add New Dress from the admin");
    expect(tree.map((entry) => entry.path)).toEqual(["public/products/new-dress-a.webp", "src/data/catalog.json"]);
    expect(saved()[0].slug).toBe("new-dress");
    expect(saved()).toHaveLength(4);
    expect(github.mock.calls.some(([url]) => url.endsWith("/git/refs/heads/main"))).toBe(true);
  });

  it("refuses uploads outside the products folder, and files that aren't images", async () => {
    const { cookie } = await session();
    for (const path of ["public/../worker/index.ts", ".github/workflows/deploy.yml", "public/products/x.html", "public/products/a/b.webp"]) {
      const response = await post("save", { product: newProduct(), uploads: [{ path, base64: WEBP }], catalogSha: "catalog-sha" }, { cookie });
      expect(response.status).toBe(422);
    }
    const script = Buffer.from("<script>alert(1)</script>").toString("base64");
    const notImage = await post(
      "save",
      { product: newProduct(), uploads: [{ path: "public/products/x.webp", base64: script }], catalogSha: "catalog-sha" },
      { cookie },
    );
    expect(notImage.status).toBe(422);
    expect(tree).toEqual([]);
  });

  it("refuses invalid products and duplicate names", async () => {
    const { cookie } = await session();
    expect((await post("save", { product: newProduct({ price: -5 }), catalogSha: "catalog-sha" }, { cookie })).status).toBe(422);
    const duplicate = await post("save", { product: newProduct({ slug: "first" }), catalogSha: "catalog-sha" }, { cookie });
    expect(duplicate.status).toBe(422);
    expect(tree).toEqual([]);
  });

  it("won't overwrite changes made since the page was opened", async () => {
    const { cookie } = await session();
    const response = await post("save", { product: newProduct(), catalogSha: "old-sha" }, { cookie });
    expect(response.status).toBe(409);
    expect(tree).toEqual([]);
  });

  it("edits in place and removes only photos nothing else uses", async () => {
    const { cookie } = await session();
    const response = await post(
      "save",
      {
        originalSlug: "second",
        product: { ...catalog[1] as object, name: "Renamed", price: 5000, images: ["/products/second-b.webp"] },
        uploads: [{ path: "public/products/second-b.webp", base64: WEBP }],
        catalogSha: "catalog-sha",
      },
      { cookie },
    );
    expect(response.status).toBe(200);
    expect(saved().map((entry: { slug: string }) => entry.slug)).toEqual(["first", "second", "third"]);
    expect(saved()[1].price).toBe(5000);
    const removed = tree.filter((entry) => entry.sha === null).map((entry) => entry.path);
    expect(removed).toEqual(["public/products/second.webp"]);
  });

  it("removes a product and its colour photos, but not shared ones", async () => {
    const { cookie } = await session();
    const response = await post("delete", { slug: "third", catalogSha: "catalog-sha" }, { cookie });
    expect(response.status).toBe(200);
    expect(commitMessage).toBe("Remove third from the admin");
    expect(saved()).toHaveLength(2);
    const removed = tree.filter((entry) => entry.sha === null).map((entry) => entry.path);
    expect(removed.sort()).toEqual(["public/products/third-red.webp", "public/products/third.webp"]);
  });

  it("reports a GitHub failure instead of claiming success", async () => {
    const { cookie } = await session();
    github.mockImplementation(async () => new Response("nope", { status: 500 }));
    const response = await post("save", { product: newProduct(), catalogSha: "catalog-sha" }, { cookie });
    expect(response.status).toBe(502);
  });
});

describe("validateProduct", () => {
  it("accepts a full product and drops unknown fields", () => {
    const result = validateProduct(newProduct({ hacked: true, sizing: "standard", sizes: [" S ", "M", ""] }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.product).not.toHaveProperty("hacked");
    expect(result.product.sizes).toEqual(["S", "M"]);
  });

  it("rejects bad values", () => {
    const bad = [
      { slug: "../etc" },
      { name: "  " },
      { category: "nope" },
      { price: 1.5 },
      { price: 9000, compareAtPrice: 100 },
      { images: [] },
      { images: ["https://evil.example/x.webp"] },
      { images: ["/products/../secret.webp"] },
      { sizing: "standard" },
      { availability: { kind: "limited" } },
      { colors: [{ name: "Red", hex: "red" }] },
      { colors: [{ name: "Red", hex: "#ff0000", image: "javascript:alert(1)" }] },
      { options: [{ name: "Big", price: 100 }] },
    ];
    for (const overrides of bad) {
      expect(validateProduct(newProduct(overrides)).ok, JSON.stringify(overrides)).toBe(false);
    }
  });
});
