import { Buffer } from "node:buffer";
import type { Product } from "../src/data/products";
import { validateProduct } from "../src/lib/product-validation";
import { commitChanges, readCatalog, StaleCatalogError, CATALOG_PATH, type FileChange, type GitHubEnv } from "./github";

const COOKIE = "aot_admin";
const SESSION_SECONDS = 12 * 60 * 60;
const MAX_BODY_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_UPLOADS = 12;
const UPLOAD_PATH = /^public\/products\/[a-z0-9-]+\.(?:webp|jpg)$/;

export interface AdminEnv extends GitHubEnv {
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
}

type BotCheck = (request: Request, token: string) => Promise<boolean>;

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

async function hmac(secret: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

// Comparing two HMACs keeps the check constant-time whatever the input's length.
async function safeEqual(secret: string, a: string, b: string): Promise<boolean> {
  const [left, right] = await Promise.all([hmac(secret, a), hmac(secret, b)]);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}

async function createSession(secret: string, now = Date.now()): Promise<string> {
  const expires = Math.floor(now / 1000) + SESSION_SECONDS;
  const signature = Buffer.from(await hmac(secret, `admin.${expires}`)).toString("base64url");
  return `${expires}.${signature}`;
}

export async function isValidSession(secret: string, value: string, now = Date.now()): Promise<boolean> {
  const [expires, signature] = value.split(".");
  if (!expires || !signature || Number(expires) < now / 1000) return false;
  const expected = Buffer.from(await hmac(secret, `admin.${expires}`)).toString("base64url");
  return safeEqual(secret, expected, signature);
}

function readCookie(request: Request): string {
  const header = request.headers.get("cookie") ?? "";
  return header.match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`))?.[1] ?? "";
}

function sessionCookie(value: string, maxAge: number): string {
  return `${COOKIE}=${value}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function imagePaths(product: Product): string[] {
  const paths = [...product.images, ...(product.colors ?? []).flatMap((color) => color.image ?? [])];
  return paths.filter((path) => path.startsWith("/products/")).map((path) => `public${path}`);
}

function catalogFile(products: unknown[]): FileChange {
  return { path: CATALOG_PATH, text: `${JSON.stringify({ products }, null, 2)}\n` };
}

function unusedFiles(removed: Product, remaining: Product[], kept: string[] = []): FileChange[] {
  const stillUsed = new Set([...remaining.flatMap(imagePaths), ...kept]);
  return [...new Set(imagePaths(removed))]
    .filter((path) => !stillUsed.has(path))
    .map((path) => ({ path, remove: true }));
}

function isImage(bytes: Buffer): boolean {
  const webp = bytes.toString("latin1", 0, 4) === "RIFF" && bytes.toString("latin1", 8, 12) === "WEBP";
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return webp || jpeg;
}

async function save(body: Record<string, unknown>, env: AdminEnv): Promise<Response> {
  const result = validateProduct(body.product);
  if (!result.ok) return json({ errors: result.errors }, 422);
  const { product } = result;

  const uploads = Array.isArray(body.uploads) ? body.uploads : [];
  if (uploads.length > MAX_UPLOADS) return json({ errors: ["Too many photos at once."] }, 422);

  const changes: FileChange[] = [];
  for (const upload of uploads as { path?: unknown; base64?: unknown }[]) {
    const { path, base64 } = upload ?? {};
    if (typeof path !== "string" || !UPLOAD_PATH.test(path) || typeof base64 !== "string") {
      return json({ errors: ["One of the photos isn't valid."] }, 422);
    }
    const bytes = Buffer.from(base64, "base64");
    if (bytes.length > MAX_UPLOAD_BYTES || !isImage(bytes)) {
      return json({ errors: ["One of the photos isn't valid."] }, 422);
    }
    changes.push({ path, base64 });
  }

  const catalog = await readCatalog(env);
  const products = catalog.products as Product[];
  const originalSlug = typeof body.originalSlug === "string" ? body.originalSlug : "";
  const index = products.findIndex((entry) => entry.slug === originalSlug);
  if (originalSlug && index === -1) return json({ errors: ["That product no longer exists."] }, 404);
  if (products.some((entry, i) => entry.slug === product.slug && i !== index)) {
    return json({ errors: ["Another product already has that name."] }, 422);
  }

  const next = [...products];
  if (index === -1) next.unshift(product);
  else next[index] = product;

  if (index !== -1) changes.push(...unusedFiles(products[index], next));
  changes.push(catalogFile(next));

  await commitChanges(
    env,
    `${index === -1 ? "Add" : "Update"} ${product.name} from the admin`,
    changes,
    String(body.catalogSha ?? ""),
  );
  return json({ ok: true });
}

async function remove(body: Record<string, unknown>, env: AdminEnv): Promise<Response> {
  const catalog = await readCatalog(env);
  const products = catalog.products as Product[];
  const target = products.find((entry) => entry.slug === body.slug);
  if (!target) return json({ errors: ["That product no longer exists."] }, 404);

  const next = products.filter((entry) => entry !== target);
  await commitChanges(
    env,
    `Remove ${target.name} from the admin`,
    [...unusedFiles(target, next), catalogFile(next)],
    String(body.catalogSha ?? ""),
  );
  return json({ ok: true });
}

export async function handleAdmin(
  request: Request,
  env: AdminEnv,
  passesBotCheck: BotCheck,
): Promise<Response> {
  const url = new URL(request.url);
  const route = url.pathname.slice("/api/admin/".length);
  const secret = env.ADMIN_SESSION_SECRET;

  // With no password set, the admin stays shut.
  if (!env.ADMIN_PASSWORD || !secret) return json({ errors: ["The admin isn't set up yet."] }, 503);

  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    if (!origin || origin !== url.origin) return json({ errors: ["This request isn't allowed."] }, 403);
    if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
      return json({ errors: ["That's too much to save at once."] }, 413);
    }
  }

  if (route === "login" && request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const human = await passesBotCheck(request, String(body.token ?? "")).catch(() => false);
    if (!human) return json({ errors: ["We couldn't verify you're a person. Please try again."] }, 403);
    if (!(await safeEqual(secret, String(body.password ?? ""), env.ADMIN_PASSWORD))) {
      return json({ errors: ["That password isn't right."] }, 401);
    }
    const session = await createSession(secret);
    return json({ ok: true }, 200, { "set-cookie": sessionCookie(session, SESSION_SECONDS) });
  }

  if (!(await isValidSession(secret, readCookie(request)))) {
    return json({ errors: ["Please log in."] }, 401);
  }

  try {
    if (route === "logout" && request.method === "POST") {
      return json({ ok: true }, 200, { "set-cookie": sessionCookie("", 0) });
    }
    if (route === "catalog" && request.method === "GET") return json(await readCatalog(env));

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (route === "save" && request.method === "POST") return await save(body, env);
    if (route === "delete" && request.method === "POST") return await remove(body, env);
  } catch (error) {
    if (error instanceof StaleCatalogError) {
      return json({ errors: ["The products changed since you opened this. Refresh and try again."] }, 409);
    }
    console.error("Admin request failed", route, error);
    return json({ errors: ["That didn't save. Please try again."] }, 502);
  }

  return json({ errors: ["Not found."] }, 404);
}
