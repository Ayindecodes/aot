import { Buffer } from "node:buffer";
import { business } from "../src/data/business";
import { formatNaira } from "../src/lib/catalog";
import { describeLineOptions, type PricedOrder } from "../src/lib/order";

const RESEND_URL = "https://api.resend.com/emails";

export interface EmailEnv {
  RESEND_API_KEY?: string;
  ORDER_ALERT_EMAIL: string;
  ORDER_FROM_EMAIL: string;
  ORDER_EMAIL_MODE?: string;
  ORDER_ACTION_SECRET?: string;
}

export type UpdateLink = { label: string; url: string };

type Message = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: { filename: string; content: string }[];
  idempotencyKey?: string;
};

export type Receipt = {
  bytes: Uint8Array;
  extension: string;
  contentType: string;
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
}

function feeLabel(order: PricedOrder): string {
  return order.delivery.fee === 0 ? "Free" : formatNaira(order.delivery.fee ?? 0);
}

function itemRows(order: PricedOrder): string {
  return order.lines
    .map((line) => {
      const options = describeLineOptions(line);
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #efe4d7">
          <strong>${line.quantity} x ${escapeHtml(line.name)}</strong>
          ${options ? `<br><span style="color:#6b5646">${escapeHtml(options)}</span>` : ""}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #efe4d7;text-align:right;white-space:nowrap">${formatNaira(line.lineTotal)}</td>
      </tr>`;
    })
    .join("");
}

function itemLines(order: PricedOrder): string[] {
  return order.lines.map((line) => {
    const options = describeLineOptions(line);
    return `${line.quantity} x ${line.name}${options ? ` (${options})` : ""}: ${formatNaira(line.lineTotal)}`;
  });
}

export function renderOrderEmail(
  order: PricedOrder,
  orderNumber: string,
  updateLinks: UpdateLink[] = [],
) {
  const { customer, delivery } = order;
  const limitedItems = order.lines.filter((line) => line.limited).map((line) => line.name);
  const stockReminder = limitedItems.length
    ? `Stock reminder: ${limitedItems.join(", ")} is limited. Tell the developer once payment is confirmed, so the count can be updated.`
    : "";

  const textLines = [
    `New order ${orderNumber}`,
    "",
    ...itemLines(order),
    "",
    `Subtotal: ${formatNaira(order.subtotal)}`,
    `Delivery: ${feeLabel(order)}`,
    `Total paid: ${formatNaira(order.total)}`,
    "",
    `Customer: ${customer.name}`,
    `Phone: ${customer.phone}`,
    ...(customer.email ? [`Email: ${customer.email}`] : []),
    `Delivery option: ${delivery.label}`,
    ...(delivery.address ? [`Address: ${delivery.address}`] : []),
    ...(delivery.landmark ? [`Landmark: ${delivery.landmark}`] : []),
    "",
    "The receipt is attached. Check your Moniepoint account before processing this order.",
    ...(stockReminder ? ["", stockReminder] : []),
    ...(updateLinks.length
      ? ["", "Email the customer:", ...updateLinks.map((link) => `${link.label}: ${link.url}`)]
      : []),
  ];

  const buttons = updateLinks
    .map(
      (link) =>
        `<a href="${escapeHtml(link.url)}" style="display:inline-block;margin:0 6px 8px 0;padding:10px 14px;border-radius:999px;background:#694634;color:#f8f3ec;font-size:14px;text-decoration:none">${escapeHtml(link.label)}</a>`,
    )
    .join("");

  const html = `<div style="font-family:Arial,sans-serif;color:#382319;max-width:560px;margin:0 auto">
    <h1 style="font-size:22px;margin:0 0 4px">New order ${escapeHtml(orderNumber)}</h1>
    <p style="margin:0 0 20px;color:#6b5646">Total paid: <strong>${formatNaira(order.total)}</strong></p>
    <table style="width:100%;border-collapse:collapse">${itemRows(order)}</table>
    <p style="margin:16px 0 4px">Subtotal: ${formatNaira(order.subtotal)}</p>
    <p style="margin:0 0 20px">Delivery: ${feeLabel(order)}</p>
    <h2 style="font-size:16px;margin:0 0 8px">Customer</h2>
    <p style="margin:0 0 4px">${escapeHtml(customer.name)}</p>
    ${customer.email ? `<p style="margin:0 0 4px">${escapeHtml(customer.email)}</p>` : ""}
    <p style="margin:0 0 20px">
      <a href="tel:${escapeHtml(customer.phone)}" style="color:#694634">${escapeHtml(customer.phone)}</a>
      &nbsp;|&nbsp;
      <a href="https://wa.me/${whatsappNumber(customer.phone)}" style="color:#694634">WhatsApp</a>
    </p>
    <h2 style="font-size:16px;margin:0 0 8px">Delivery</h2>
    <p style="margin:0 0 4px">${escapeHtml(delivery.label)}</p>
    ${delivery.address ? `<p style="margin:0 0 4px">${escapeHtml(delivery.address)}</p>` : ""}
    ${delivery.landmark ? `<p style="margin:0 0 4px">Landmark: ${escapeHtml(delivery.landmark)}</p>` : ""}
    <p style="margin:24px 0 0;padding:12px;background:#efe4d7;border-radius:6px">
      The receipt is attached. Check your Moniepoint account before processing this order.
    </p>
    ${stockReminder ? `<p style="margin:12px 0 0;padding:12px;background:#efe4d7;border-radius:6px">${escapeHtml(stockReminder)}</p>` : ""}
    ${
      buttons
        ? `<h2 style="font-size:16px;margin:24px 0 4px">Email the customer</h2>
    <p style="margin:0 0 12px;color:#6b5646">Tap a step as the order moves along. You'll confirm before anything is sent.</p>
    ${buttons}`
        : ""
    }
  </div>`;

  return {
    subject: `New order ${orderNumber} - ${formatNaira(order.total)}`,
    html,
    text: textLines.join("\n"),
  };
}

const contactLine = `Questions? Message us on WhatsApp on ${business.phoneDisplay}. Please don't reply to this email.`;

export function renderCustomerEmail(title: string, paragraphs: string[], extraHtml = "") {
  const html = `<div style="font-family:Arial,sans-serif;color:#382319;max-width:560px;margin:0 auto">
    <img src="${business.siteUrl}/logo/aot-logo-header.png" alt="${business.name}" width="114" height="80" style="display:block;margin:0 0 16px">
    <h1 style="font-size:22px;margin:0 0 12px">${escapeHtml(title)}</h1>
    ${paragraphs.map((paragraph) => `<p style="margin:0 0 12px;line-height:1.5">${escapeHtml(paragraph)}</p>`).join("")}
    ${extraHtml}
    <p style="margin:24px 0 0;padding-top:12px;border-top:1px solid #efe4d7;color:#6b5646;font-size:14px">
      <a href="https://wa.me/${business.whatsappNumber}" style="color:#694634">${escapeHtml(contactLine)}</a>
    </p>
    <p style="margin:8px 0 0;color:#6b5646;font-size:14px">${escapeHtml(business.name)}. ${escapeHtml(business.tagline)}</p>
  </div>`;
  const text = [title, "", ...paragraphs.flatMap((p) => [p, ""]), contactLine, business.name].join("\n");
  return { html, text };
}

export function renderReceivedEmail(order: PricedOrder, orderNumber: string) {
  const { delivery } = order;
  const paragraphs = [
    `Hello ${order.customer.name}, thank you for your order.`,
    `We've received order ${orderNumber} and your receipt. We'll check your payment and email you once it's confirmed.`,
  ];
  const summary = [
    `Delivery: ${delivery.label}`,
    ...(delivery.address ? [`Address: ${delivery.address}`] : []),
    ...(delivery.option === "pickup" ? [`Pickup address: ${business.pickupAddress}`] : []),
    `Total: ${formatNaira(order.total)}`,
  ];
  const { html, text } = renderCustomerEmail(
    "We've received your order",
    paragraphs,
    `<table style="width:100%;border-collapse:collapse">${itemRows(order)}</table>
    ${summary.map((line) => `<p style="margin:8px 0 0">${escapeHtml(line)}</p>`).join("")}`,
  );
  return {
    subject: `We've received your order ${orderNumber}`,
    html,
    text: [text, "", ...itemLines(order), ...summary].join("\n"),
  };
}

export async function sendEmail(env: EmailEnv, message: Message): Promise<"sent" | "duplicate"> {
  if (env.ORDER_EMAIL_MODE === "log") {
    console.log(`[email to ${message.to}]\n${message.subject}\n\n${message.text}`);
    for (const file of message.attachments ?? []) console.log(`[attachment] ${file.filename}`);
    return "sent";
  }

  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");

  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
      ...(message.idempotencyKey ? { "idempotency-key": message.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: env.ORDER_FROM_EMAIL,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments,
    }),
  });

  // Resend refuses the same key with different content, such as a reworded cancellation.
  if (response.status === 409) return "duplicate";
  if (!response.ok) {
    throw new Error(`Resend returned ${response.status}: ${await response.text()}`);
  }
  return "sent";
}

export async function sendOrderEmail(
  env: EmailEnv,
  order: PricedOrder,
  orderNumber: string,
  receipt: Receipt,
  updateLinks: UpdateLink[] = [],
): Promise<void> {
  await sendEmail(env, {
    to: env.ORDER_ALERT_EMAIL,
    ...renderOrderEmail(order, orderNumber, updateLinks),
    attachments: [
      {
        filename: `${orderNumber}-receipt.${receipt.extension}`,
        content: Buffer.from(receipt.bytes).toString("base64"),
      },
    ],
  });
}

export async function sendReceivedEmail(
  env: EmailEnv,
  order: PricedOrder,
  orderNumber: string,
): Promise<void> {
  if (!order.customer.email) return;
  await sendEmail(env, {
    to: order.customer.email,
    ...renderReceivedEmail(order, orderNumber),
    idempotencyKey: `${orderNumber}-received`,
  });
}
