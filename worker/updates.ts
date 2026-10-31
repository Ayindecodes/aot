import { Buffer } from "node:buffer";
import { business } from "../src/data/business";
import { formatNaira } from "../src/lib/catalog";
import type { PricedOrder } from "../src/lib/order";
import {
  escapeHtml,
  renderCustomerEmail,
  sendEmail,
  type EmailEnv,
  type UpdateLink,
} from "./email";

const TOKEN_LIFETIME_SECONDS = 120 * 24 * 60 * 60;
const MAX_REASON_LENGTH = 300;
export const DEFAULT_CANCEL_REASON = "We couldn't confirm your payment.";

// There's no database, so the owner's email carries the order details in a signed link.
export type OrderRef = {
  orderNumber: string;
  email: string;
  name: string;
  total: number;
  pickup: boolean;
  issuedAt: number;
};

const STATUSES = ["payment", "processed", "ready", "out", "done", "cancelled"] as const;
export type UpdateStatus = (typeof STATUSES)[number];

function statusesFor(ref: OrderRef): UpdateStatus[] {
  return STATUSES.filter((status) => !(ref.pickup && status === "out"));
}

function describeUpdate(status: UpdateStatus, ref: OrderRef) {
  const { orderNumber, pickup } = ref;
  switch (status) {
    case "payment":
      return {
        label: "Payment received",
        title: "Payment received",
        subject: `Payment received for order ${orderNumber}`,
        message: `We've confirmed your payment of ${formatNaira(ref.total)}. Thank you for shopping with us.`,
      };
    case "processed":
      return {
        label: "Order processed",
        title: "Your order has been processed",
        subject: `Order ${orderNumber} has been processed`,
        message: "We've processed your order, and we're getting it ready for you.",
      };
    case "ready":
      return pickup
        ? {
            label: "Ready for pickup",
            title: "Your order is ready for pickup",
            subject: `Order ${orderNumber} is ready for pickup`,
            message: `You can pick up your order from ${business.pickupAddress}.`,
          }
        : {
            label: "Ready to be delivered",
            title: "Your order is ready to be delivered",
            subject: `Order ${orderNumber} is ready to be delivered`,
            message: "Your order is ready, and we'll let you know when it's on its way.",
          };
    case "out":
      return {
        label: "Out for delivery",
        title: "Your order is out for delivery",
        subject: `Order ${orderNumber} is out for delivery`,
        message: "Your order is on its way to you.",
      };
    case "done":
      return pickup
        ? {
            label: "Picked up",
            title: "Your order has been picked up",
            subject: `Order ${orderNumber} has been picked up`,
            message: "Thank you for shopping with us. We hope you love your new piece.",
          }
        : {
            label: "Delivered",
            title: "Your order has been delivered",
            subject: `Order ${orderNumber} has been delivered`,
            message: "Thank you for shopping with us. We hope you love your new piece.",
          };
    case "cancelled":
      return {
        label: "Cancel order",
        title: "Your order has been cancelled",
        subject: `Order ${orderNumber} has been cancelled`,
        message: "We've cancelled your order.",
      };
  }
}

async function signingKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signOrderRef(ref: OrderRef, secret: string): Promise<string> {
  const payload = Buffer.from(JSON.stringify(ref)).toString("base64url");
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(secret),
    new TextEncoder().encode(payload),
  );
  return `${payload}.${Buffer.from(signature).toString("base64url")}`;
}

export async function verifyOrderRef(
  token: string,
  secret: string,
  now = Date.now(),
): Promise<OrderRef | null> {
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length > 0) return null;

  const valid = await crypto.subtle.verify(
    "HMAC",
    await signingKey(secret),
    Buffer.from(signature, "base64url"),
    new TextEncoder().encode(payload),
  );
  if (!valid) return null;

  const ref = JSON.parse(Buffer.from(payload, "base64url").toString()) as OrderRef;
  if (now / 1000 > ref.issuedAt + TOKEN_LIFETIME_SECONDS) return null;
  return ref;
}

export async function createUpdateLinks(
  env: EmailEnv,
  request: Request,
  order: PricedOrder,
  orderNumber: string,
): Promise<UpdateLink[]> {
  const email = order.customer.email;
  if (!email) return [];
  if (!env.ORDER_ACTION_SECRET) {
    console.error("ORDER_ACTION_SECRET is not set, so the order email has no update buttons");
    return [];
  }

  const ref: OrderRef = {
    orderNumber,
    email,
    name: order.customer.name,
    total: order.total,
    pickup: order.delivery.option === "pickup",
    issuedAt: Math.floor(Date.now() / 1000),
  };
  const token = await signOrderRef(ref, env.ORDER_ACTION_SECRET);
  const { origin } = new URL(request.url);
  return statusesFor(ref).map((status) => ({
    label: describeUpdate(status, ref).label,
    url: `${origin}/api/order-update?status=${status}&token=${encodeURIComponent(token)}`,
  }));
}

function page(title: string, body: string, status = 200): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} | ${business.name}</title>
<style>
  body { margin: 0; background: #f8f3ec; color: #382319; font-family: Arial, sans-serif; line-height: 1.5; }
  main { box-sizing: border-box; max-width: 32rem; margin: 0 auto; padding: 2rem 1.25rem; }
  img { display: block; margin-bottom: 1rem; }
  h1 { margin: 0 0 .75rem; font-family: Georgia, serif; font-size: 1.75rem; font-weight: 500; line-height: 1.2; }
  p { margin: 0 0 1rem; }
  label { display: block; margin-bottom: .375rem; font-weight: 600; }
  textarea { box-sizing: border-box; width: 100%; margin-bottom: 1rem; padding: .625rem; border: 1px solid #b8a393; border-radius: .5rem; font: inherit; }
  button { min-height: 3rem; padding: .75rem 1.75rem; border: 0; border-radius: 999px; background: #694634; color: #f8f3ec; font: inherit; font-weight: 600; cursor: pointer; }
</style>
</head>
<body><main>
<img src="/logo/aot-logo-header.png" alt="${business.name}" width="114" height="80">
<h1>${escapeHtml(title)}</h1>
${body}
</main></body>
</html>`;
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "x-robots-tag": "noindex",
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}

const invalidLink = () =>
  page(
    "This link isn't valid",
    "<p>It may have expired. You can still contact the customer directly.</p>",
    400,
  );

export async function handleOrderUpdate(request: Request, env: EmailEnv): Promise<Response> {
  if (request.method !== "GET" && request.method !== "POST") {
    return page("Not allowed", "<p>This action isn't allowed.</p>", 405);
  }

  const url = new URL(request.url);
  const isPost = request.method === "POST";
  const origin = request.headers.get("origin");
  if (isPost && origin && origin !== url.origin) {
    return page("Not allowed", "<p>This action isn't allowed.</p>", 403);
  }

  const form = isPost ? await request.formData().catch(() => null) : null;
  const read = (name: string) => String((isPost ? form?.get(name) : url.searchParams.get(name)) ?? "");
  const token = read("token");
  const status = read("status") as UpdateStatus;

  if (!env.ORDER_ACTION_SECRET) return page("Not set up yet", "<p>Please tell the developer.</p>", 503);

  const ref = await verifyOrderRef(token, env.ORDER_ACTION_SECRET).catch(() => null);
  if (!ref || !statusesFor(ref).includes(status)) return invalidLink();

  const update = describeUpdate(status, ref);
  const cancelling = status === "cancelled";

  // Email apps open links to scan them, so a GET only ever shows this page. Sending needs a POST.
  if (!isPost) {
    return page(
      update.label,
      `<p>Order ${escapeHtml(ref.orderNumber)} for ${escapeHtml(ref.name)}.</p>
<p>This will email <strong>${escapeHtml(ref.email)}</strong>.</p>
<form method="post" action="/api/order-update">
<input type="hidden" name="token" value="${escapeHtml(token)}">
<input type="hidden" name="status" value="${escapeHtml(status)}">
${
  cancelling
    ? `<label for="reason">Reason for cancelling</label>
<textarea id="reason" name="reason" rows="3" maxlength="${MAX_REASON_LENGTH}" required>${escapeHtml(DEFAULT_CANCEL_REASON)}</textarea>`
    : ""
}
<button type="submit">${cancelling ? "Cancel and email customer" : "Email customer"}</button>
</form>`,
    );
  }

  const reason = read("reason").trim().slice(0, MAX_REASON_LENGTH);
  if (cancelling && !reason) return page(update.label, "<p>Please go back and add a reason.</p>", 422);

  const paragraphs = [
    `Hello ${ref.name},`,
    update.message,
    ...(cancelling ? [`Reason: ${reason}`, "If you think this is a mistake, please message us."] : []),
    `Order number: ${ref.orderNumber}`,
  ];

  try {
    const result = await sendEmail(env, {
      to: ref.email,
      subject: update.subject,
      ...renderCustomerEmail(update.title, paragraphs),
      idempotencyKey: `${ref.orderNumber}-${status}`,
    });
    return page(
      result === "duplicate" ? "Already sent" : "Email sent",
      `<p>${escapeHtml(ref.name)} has been told: ${escapeHtml(update.title)}. You can close this page.</p>`,
    );
  } catch (error) {
    console.error("Order update failed", ref.orderNumber, status, error);
    return page("That didn't send", "<p>Please go back and try again.</p>", 502);
  }
}
