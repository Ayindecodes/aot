import { MAX_RECEIPT_BYTES, priceOrder } from "../src/lib/order";
import { sendOrderEmail, sendReceivedEmail, type EmailEnv } from "./email";
import { createUpdateLinks, handleOrderUpdate } from "./updates";

const MAX_BODY_BYTES = MAX_RECEIPT_BYTES + 256 * 1024;

const ORDER_NUMBER_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

const TURNSTILE_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface Env extends EmailEnv {
  ASSETS: { fetch: typeof fetch };
  BOT_CHECK_OFF?: string;
  TURNSTILE_SECRET_KEY?: string;
}

type ReceiptType = { extension: string; contentType: string };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

// Checks the file's leading bytes, because the name and type are set by the sender.
export function detectReceiptType(bytes: Uint8Array): ReceiptType | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  if (ascii(0, 8) === "\x89PNG\r\n\x1a\n") return { extension: "png", contentType: "image/png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return { extension: "webp", contentType: "image/webp" };
  }
  if (ascii(0, 5) === "%PDF-") return { extension: "pdf", contentType: "application/pdf" };
  return null;
}

export function createOrderNumber(now = new Date()): string {
  const lagosTime = new Date(now.getTime() + 60 * 60 * 1000);
  const date = lagosTime.toISOString().slice(2, 10).replaceAll("-", "");
  const random = crypto.getRandomValues(new Uint8Array(4));
  const suffix = Array.from(
    random,
    (byte) => ORDER_NUMBER_ALPHABET[byte % ORDER_NUMBER_ALPHABET.length],
  ).join("");
  return `AOT-${date}-${suffix}`;
}

// Orders email whatever address they're given, so bots must be stopped before that can happen.
async function passesBotCheck(request: Request, env: Env, token: string): Promise<boolean> {
  if (env.ORDER_EMAIL_MODE === "log" || env.BOT_CHECK_OFF === "true") return true;
  if (!env.TURNSTILE_SECRET_KEY || !token) return false;

  const response = await fetch(TURNSTILE_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: request.headers.get("cf-connecting-ip") ?? undefined,
    }),
  });
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}

async function handleOrder(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ errors: ["Method not allowed."] }, 405);

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ errors: ["This request isn't allowed."] }, 403);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ errors: ["Your receipt is too large. The limit is 5 MB."] }, 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ errors: ["We couldn't read your order. Please try again."] }, 400);
  }

  // Hidden from people, so it's only filled in by bots or autofill. Real customers see an
  // error rather than a false success, so an order is never dropped silently.
  if (form.get("website")) {
    return json({ errors: ["We couldn't submit your order. Please try again."] }, 400);
  }

  let input: unknown;
  try {
    input = JSON.parse(String(form.get("order")));
  } catch {
    return json({ errors: ["We couldn't read your order. Please try again."] }, 400);
  }

  const result = priceOrder(input, "pay");
  if (!result.ok) return json({ errors: result.errors }, 422);

  const receipt = form.get("receipt");
  if (!(receipt instanceof File) || receipt.size === 0) {
    return json({ errors: ["Upload your payment receipt."] }, 422);
  }
  if (receipt.size > MAX_RECEIPT_BYTES) {
    return json({ errors: ["Your receipt is too large. The limit is 5 MB."] }, 413);
  }

  const bytes = new Uint8Array(await receipt.arrayBuffer());
  const receiptType = detectReceiptType(bytes);
  if (!receiptType) {
    return json({ errors: ["Upload your receipt as a JPG, PNG, WebP or PDF."] }, 422);
  }

  // This runs last because each token works once, and earlier errors can be fixed and resubmitted.
  const human = await passesBotCheck(
    request,
    env,
    String(form.get("cf-turnstile-response") ?? ""),
  ).catch(() => false);
  if (!human) {
    return json({ errors: ["We couldn't verify you're a person. Please try again."] }, 403);
  }

  const orderNumber = createOrderNumber();
  const updateLinks = await createUpdateLinks(env, request, result.order, orderNumber);
  try {
    await sendOrderEmail(env, result.order, orderNumber, { bytes, ...receiptType }, updateLinks);
  } catch (error) {
    console.error("Order email failed", orderNumber, error);
    return json(
      { errors: ["We couldn't send your order. Please try again or message us on WhatsApp."] },
      502,
    );
  }

  // The owner has the order at this point, so a failed confirmation mustn't fail the customer.
  try {
    await sendReceivedEmail(env, result.order, orderNumber);
  } catch (error) {
    console.error("Customer confirmation failed", orderNumber, error);
  }

  return json({ orderNumber });
}

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/order") return handleOrder(request, env);
    if (pathname === "/api/order-update") return handleOrderUpdate(request, env);
    return env.ASSETS.fetch(request);
  },
};

export default handler;
