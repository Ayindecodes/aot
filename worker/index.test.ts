import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderOrderEmail } from "./email";
import worker, { createOrderNumber, detectReceiptType, type Env } from "./index";
import { signOrderRef, verifyOrderRef, type OrderRef } from "./updates";
import { priceOrder } from "../src/lib/order";

vi.mock("../src/data/products", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/data/products")>();
  const { testProducts } = await import("../src/lib/test-products");
  return {
    ...actual,
    getProduct: (slug: string) =>
      actual.getProduct(slug) ?? testProducts.find((product) => product.slug === slug),
  };
});

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

const order = {
  lines: [{ slug: "test-abaya-two", quantity: 1, size: "M" }],
  customer: { name: "Test Customer", phone: "08031234567", email: "customer@example.com" },
  delivery: { option: "ilorin", address: "12 Test Street" },
  policyAccepted: true,
};

function env(overrides: Partial<Env> = {}): Env {
  return {
    ASSETS: { fetch: vi.fn(async () => new Response("asset")) },
    RESEND_API_KEY: "test-key",
    ORDER_ALERT_EMAIL: "owner@example.com",
    ORDER_FROM_EMAIL: "Orders <orders@example.com>",
    ORDER_ACTION_SECRET: "test-secret",
    TURNSTILE_SECRET_KEY: "turnstile-secret",
    ...overrides,
  };
}

function orderRequest({
  body = order as unknown,
  receipt = new File([JPEG], "receipt.jpg") as File | null,
  website = "",
  headers = {} as Record<string, string>,
  botToken = "bot-token",
} = {}) {
  const form = new FormData();
  form.append("cf-turnstile-response", botToken);
  form.append("order", JSON.stringify(body));
  form.append("website", website);
  if (receipt) form.append("receipt", receipt);
  return new Request("https://aotwears.store/api/order", { method: "POST", body: form, headers });
}

describe("order endpoint", () => {
  const fetchMock = vi.fn();
  const botCheck = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset().mockImplementation(async () => new Response("{}", { status: 200 }));
    botCheck.mockReset().mockImplementation(async () => Response.json({ success: true }));
    vi.stubGlobal("fetch", (url: string, init: RequestInit) =>
      url.includes("siteverify") ? botCheck(url, init) : fetchMock(url, init),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("emails the owner with the receipt attached", async () => {
    const response = await worker.fetch(orderRequest(), env());
    const body = (await response.json()) as { orderNumber: string };

    expect(response.status).toBe(200);
    expect(body.orderNumber).toMatch(/^AOT-\d{6}-[2-9A-Z]{4}$/);

    const [url, init] = fetchMock.mock.calls[0];
    const sent = JSON.parse(init.body);
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.authorization).toBe("Bearer test-key");
    expect(sent.to).toEqual(["owner@example.com"]);
    expect(sent.subject).toContain(body.orderNumber);
    expect(sent.subject).toContain("₦15,000");
    expect(sent.attachments[0].filename).toBe(`${body.orderNumber}-receipt.jpg`);
    expect(sent.attachments[0].content).toBe(Buffer.from(JPEG).toString("base64"));
  });

  it("gives the owner update buttons and the customer a confirmation", async () => {
    const response = await worker.fetch(orderRequest(), env());
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const owner = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(owner.html).toContain("/api/order-update?status=payment");
    expect(owner.html).toContain("/api/order-update?status=cancelled");
    expect(owner.html).toContain("customer@example.com");

    const [, init] = fetchMock.mock.calls[1];
    const customer = JSON.parse(init.body);
    expect(customer.to).toEqual(["customer@example.com"]);
    expect(customer.subject).toContain("We've received your order");
    expect(customer.attachments).toBeUndefined();
    expect(init.headers["idempotency-key"]).toMatch(/-received$/);
  });

  it("keeps the order when only the customer's confirmation fails", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response("nope", { status: 500 }));
    const response = await worker.fetch(orderRequest(), env());
    expect(response.status).toBe(200);
  });

  it("still sends the order if the signing secret is missing", async () => {
    const response = await worker.fetch(orderRequest(), env({ ORDER_ACTION_SECRET: undefined }));
    expect(response.status).toBe(200);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).html).not.toContain("/api/order-update");
  });

  it("sends the visitor's token and the secret to the bot check", async () => {
    await worker.fetch(orderRequest({ headers: { "cf-connecting-ip": "1.2.3.4" } }), env());
    const sent = JSON.parse(botCheck.mock.calls[0][1].body);
    expect(sent).toEqual({ secret: "turnstile-secret", response: "bot-token", remoteip: "1.2.3.4" });
  });

  it("refuses orders that fail the bot check, before any email goes out", async () => {
    botCheck.mockImplementation(async () => Response.json({ success: false }));
    const response = await worker.fetch(orderRequest(), env());
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses orders with no bot check token", async () => {
    const response = await worker.fetch(orderRequest({ botToken: "" }), env());
    expect(response.status).toBe(403);
    expect(botCheck).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses orders if the bot check is unreachable or not set up", async () => {
    botCheck.mockRejectedValue(new Error("network down"));
    expect((await worker.fetch(orderRequest(), env())).status).toBe(403);

    const unset = await worker.fetch(orderRequest(), env({ TURNSTILE_SECRET_KEY: undefined }));
    expect(unset.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("saves the bot check token when the order has a fixable error", async () => {
    const response = await worker.fetch(orderRequest({ receipt: null }), env());
    expect(response.status).toBe(422);
    expect(botCheck).not.toHaveBeenCalled();
  });

  it("reports a failed email instead of a false success", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 500 }));
    const response = await worker.fetch(orderRequest(), env());
    expect(response.status).toBe(502);
    expect(await response.json()).toHaveProperty("errors");
  });

  it("fails when the API key is missing", async () => {
    const response = await worker.fetch(orderRequest(), env({ RESEND_API_KEY: undefined }));
    expect(response.status).toBe(502);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("only logs in log mode", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const response = await worker.fetch(orderRequest(), env({ ORDER_EMAIL_MODE: "log" }));
    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
  });

  it("refuses orders with no receipt", async () => {
    const response = await worker.fetch(orderRequest({ receipt: null }), env());
    expect(response.status).toBe(422);
  });

  it("refuses files that aren't receipts, whatever their name says", async () => {
    const receipt = new File(["<script>alert(1)</script>"], "receipt.jpg", { type: "image/jpeg" });
    const response = await worker.fetch(orderRequest({ receipt }), env());
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses receipts over the size limit", async () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big.set(JPEG);
    const response = await worker.fetch(orderRequest({ receipt: new File([big], "big.jpg") }), env());
    expect(response.status).toBe(413);
  });

  it("refuses submissions with the hidden field filled in", async () => {
    const response = await worker.fetch(orderRequest({ website: "spam" }), env());
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses requests from other sites", async () => {
    const request = orderRequest({ headers: { origin: "https://evil.example" } });
    const response = await worker.fetch(request, env());
    expect(response.status).toBe(403);
  });

  it("refuses the null origin sent by sandboxed pages", async () => {
    const request = orderRequest({ headers: { origin: "null" } });
    const response = await worker.fetch(request, env());
    expect(response.status).toBe(403);
  });

  it("accepts requests from its own site", async () => {
    const request = orderRequest({ headers: { origin: "https://aotwears.store" } });
    const response = await worker.fetch(request, env());
    expect(response.status).toBe(200);
  });

  it("refuses invalid orders and other methods", async () => {
    const invalid = await worker.fetch(orderRequest({ body: { lines: [] } }), env());
    expect(invalid.status).toBe(422);
    const get = await worker.fetch(new Request("https://aotwears.store/api/order"), env());
    expect(get.status).toBe(405);
  });

  it("accepts orders placed from the www address", async () => {
    const form = orderRequest();
    const request = new Request("https://www.aotwears.store/api/order", {
      method: "POST",
      body: await form.formData(),
      headers: { origin: "https://www.aotwears.store" },
    });
    const response = await worker.fetch(request, env());
    expect(response.status).toBe(200);
  });

  it("passes every other path to the static site", async () => {
    const testEnv = env();
    const response = await worker.fetch(new Request("https://aotwears.store/shop"), testEnv);
    expect(await response.text()).toBe("asset");
    expect(testEnv.ASSETS.fetch).toHaveBeenCalled();
  });
});

describe("detectReceiptType", () => {
  it("recognises supported formats by their bytes", () => {
    expect(detectReceiptType(JPEG)?.extension).toBe("jpg");
    expect(
      detectReceiptType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.extension,
    ).toBe("png");
    expect(detectReceiptType(new TextEncoder().encode("RIFF1234WEBPVP8 "))?.extension).toBe("webp");
    expect(detectReceiptType(new TextEncoder().encode("%PDF-1.7"))?.extension).toBe("pdf");
  });

  it("rejects everything else", () => {
    expect(detectReceiptType(new TextEncoder().encode("<html>"))).toBeNull();
    expect(detectReceiptType(new Uint8Array(0))).toBeNull();
  });
});

describe("createOrderNumber", () => {
  it("uses the date in Lagos", () => {
    expect(createOrderNumber(new Date("2026-10-30T23:30:00Z"))).toMatch(/^AOT-261031-/);
  });
});

describe("renderOrderEmail", () => {
  it("escapes customer text and reminds the owner about limited stock", () => {
    const result = priceOrder(
      {
        ...order,
        customer: { name: "<b>Bad</b>", phone: "08031234567", email: "customer@example.com" },
        delivery: { option: "ilorin", address: '"><img src=x>' },
      },
      "pay",
    );
    if (!result.ok) throw new Error(result.errors.join());

    const email = renderOrderEmail(result.order, "AOT-1");
    expect(email.html).not.toContain("<b>Bad</b>");
    expect(email.html).not.toContain("<img");
    expect(email.html).toContain("&lt;b&gt;Bad&lt;/b&gt;");
    expect(email.text).toContain("Tell the developer");
    expect(email.html).toContain("wa.me/2348031234567");
  });
});

describe("order updates", () => {
  const fetchMock = vi.fn();
  const ref: OrderRef = {
    orderNumber: "AOT-261030-TEST",
    email: "customer@example.com",
    name: "Test <b>Customer</b>",
    total: 18000,
    pickup: false,
    issuedAt: Math.floor(Date.now() / 1000),
  };

  beforeEach(() => {
    fetchMock.mockReset().mockImplementation(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const base = "https://aotwears.store/api/order-update";
  const open = (status: string, token: string) =>
    worker.fetch(new Request(`${base}?status=${status}&token=${encodeURIComponent(token)}`), env());
  const submit = (fields: Record<string, string>, headers = {}) => {
    const body = new URLSearchParams(fields);
    return worker.fetch(new Request(base, { method: "POST", body, headers }), env());
  };

  it("only shows a page when the link is opened, so email scanners can't send anything", async () => {
    const token = await signOrderRef(ref, "test-secret");
    const response = await open("payment", token);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("customer@example.com");
    expect(html).not.toContain("<b>Customer</b>");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("emails the customer once the owner confirms", async () => {
    const token = await signOrderRef(ref, "test-secret");
    const response = await submit({ token, status: "payment" });
    expect(await response.text()).toContain("Email sent");

    const [url, init] = fetchMock.mock.calls[0];
    const sent = JSON.parse(init.body);
    expect(url).toBe("https://api.resend.com/emails");
    expect(sent.to).toEqual(["customer@example.com"]);
    expect(sent.subject).toBe("Payment received for order AOT-261030-TEST");
    expect(sent.text).toContain("₦18,000");
    expect(sent.html).not.toContain("<b>Customer</b>");
    expect(init.headers["idempotency-key"]).toBe("AOT-261030-TEST-payment");
  });

  it("puts the reason in a cancellation, and needs one", async () => {
    const token = await signOrderRef(ref, "test-secret");
    const missing = await submit({ token, status: "cancelled", reason: "   " });
    expect(missing.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();

    await submit({ token, status: "cancelled", reason: "Fake <script>payment" });
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.text).toContain("Reason: Fake <script>payment");
    expect(sent.html).toContain("Fake &lt;script&gt;payment");
    expect(sent.html).not.toContain("<script>");
  });

  it("offers the pickup steps for pickup orders", async () => {
    const token = await signOrderRef({ ...ref, pickup: true }, "test-secret");
    expect((await open("out", token)).status).toBe(400);
    expect(await (await open("ready", token)).text()).toContain("Ready for pickup");
    expect(await (await open("done", token)).text()).toContain("Picked up");
  });

  it("offers the delivery steps for delivery orders", async () => {
    const token = await signOrderRef(ref, "test-secret");
    expect(await (await open("ready", token)).text()).toContain("Ready to be delivered");
    expect(await (await open("out", token)).text()).toContain("Out for delivery");
    expect(await (await open("done", token)).text()).toContain("Delivered");
  });

  it("says when an update has already gone out", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 409 }));
    const token = await signOrderRef(ref, "test-secret");
    const response = await submit({ token, status: "cancelled", reason: "Changed" });
    expect(await response.text()).toContain("Already sent");
  });

  it("reports a failed send", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 500 }));
    const token = await signOrderRef(ref, "test-secret");
    const response = await submit({ token, status: "payment" });
    expect(response.status).toBe(502);
  });

  it("refuses forged, tampered and malformed links", async () => {
    const forged = await signOrderRef(ref, "wrong-secret");
    expect((await submit({ token: forged, status: "payment" })).status).toBe(400);

    const [payload, signature] = (await signOrderRef(ref, "test-secret")).split(".");
    const changed = Buffer.from(JSON.stringify({ ...ref, email: "x@example.com" })).toString("base64url");
    expect((await submit({ token: `${changed}.${signature}`, status: "payment" })).status).toBe(400);
    expect(payload).not.toBe(changed);

    for (const token of ["", "abc", "a.b.c", "!!.!!"]) {
      expect((await submit({ token, status: "payment" })).status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses unknown steps and other sites", async () => {
    const token = await signOrderRef(ref, "test-secret");
    expect((await open("refund", token)).status).toBe(400);
    const foreign = await submit({ token, status: "payment" }, { origin: "https://evil.example" });
    expect(foreign.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("expires links after 120 days", async () => {
    const token = await signOrderRef(ref, "test-secret");
    const day = 24 * 60 * 60 * 1000;
    expect(await verifyOrderRef(token, "test-secret", Date.now() + 119 * day)).not.toBeNull();
    expect(await verifyOrderRef(token, "test-secret", Date.now() + 121 * day)).toBeNull();
  });
});
