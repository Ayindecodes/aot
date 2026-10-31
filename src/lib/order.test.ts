import { describe, expect, it, vi } from "vitest";
import { isValidPhone, priceOrder, type OrderInput } from "./order";

vi.mock("../data/products", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../data/products")>();
  const { testProducts } = await import("./test-products");
  return {
    ...actual,
    getProduct: (slug: string) =>
      actual.getProduct(slug) ?? testProducts.find((product) => product.slug === slug),
  };
});

function validOrder(overrides: Partial<OrderInput> = {}): OrderInput {
  return {
    lines: [{ slug: "test-abaya-one", quantity: 2, size: "M", color: "Cream" }],
    customer: { name: "Test Customer", phone: "0803 123 4567", email: "customer@example.com" },
    delivery: { option: "ilorin", address: "12 Test Street", landmark: "Near the market" },
    policyAccepted: true,
    ...overrides,
  };
}

function errorsFor(input: unknown, route: "pay" | "whatsapp" = "pay"): string[] {
  const result = priceOrder(input, route);
  return result.ok ? [] : result.errors;
}

describe("priceOrder", () => {
  it("totals lines and the delivery fee from the catalogue", () => {
    const result = priceOrder(validOrder(), "pay");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.subtotal).toBe(20000);
    expect(result.order.total).toBe(23000);
    expect(result.order.customer.phone).toBe("08031234567");
  });

  it("ignores prices sent by the browser", () => {
    const tampered = validOrder();
    tampered.lines[0] = { ...tampered.lines[0], unitPrice: 1, lineTotal: 1 } as never;
    const result = priceOrder({ ...tampered, total: 1, subtotal: 1 }, "pay");
    expect(result.ok && result.order.total).toBe(23000);
  });

  it("makes delivery free inside Unilorin and for pickup", () => {
    const unilorin = priceOrder(
      validOrder({ delivery: { option: "unilorin", address: "Hall 1" } }),
      "pay",
    );
    const pickup = priceOrder(validOrder({ delivery: { option: "pickup" } }), "pay");
    expect(unilorin.ok && unilorin.order.total).toBe(20000);
    expect(pickup.ok && pickup.order.total).toBe(20000);
  });

  it("drops the address for pickup", () => {
    const result = priceOrder(
      validOrder({ delivery: { option: "pickup", address: "Should go" } }),
      "pay",
    );
    expect(result.ok && result.order.delivery.address).toBeUndefined();
  });

  it("requires an address for delivery", () => {
    expect(errorsFor(validOrder({ delivery: { option: "ilorin" } }))).toContain(
      "Enter your delivery address.",
    );
  });

  it("sends orders outside Ilorin to WhatsApp", () => {
    const outside = validOrder({ delivery: { option: "outside", address: "Lagos" } });
    expect(errorsFor(outside, "pay")).toContain("Orders outside Ilorin are arranged on WhatsApp.");
    const whatsapp = priceOrder(outside, "whatsapp");
    expect(whatsapp.ok && whatsapp.order.delivery.fee).toBeNull();
  });

  it("rejects sold-out and non-orderable products", () => {
    const soldOut = validOrder({
      lines: [{ slug: "test-dress-one", quantity: 1, size: "M", color: "Cream" }],
    });
    expect(errorsFor(soldOut).join()).toContain("can't be ordered");
    const comingSoon = validOrder({
      lines: [{ slug: "test-skirt-one", quantity: 1, size: "M" }],
    });
    expect(errorsFor(comingSoon).join()).toContain("Coming soon");
  });

  it("enforces limited stock across lines of the same product", () => {
    const tooMany = validOrder({
      lines: [
        { slug: "test-scarf-one", quantity: 3, color: "Cream" },
        { slug: "test-scarf-one", quantity: 3, color: "Espresso" },
      ],
    });
    expect(errorsFor(tooMany)).toContain("Only 5 of Test Scarf One left.");
  });

  it("applies each product's sizing rule", () => {
    const standardWithoutSize = validOrder({ lines: [{ slug: "test-abaya-two", quantity: 1 }] });
    expect(errorsFor(standardWithoutSize)).toContain("Test Abaya Two: choose a size.");

    const customWithoutMeasurements = validOrder({
      lines: [{ slug: "test-custom-outfit", quantity: 1 }],
    });
    expect(errorsFor(customWithoutMeasurements)).toContain(
      "Test Custom Outfit: enter your bust and length.",
    );

    const bothOptions = validOrder({
      lines: [
        {
          slug: "test-abaya-one",
          quantity: 1,
          size: "M",
          color: "Cream",
          measurements: { bust: 40, length: 55 },
        },
      ],
    });
    expect(errorsFor(bothOptions)).toContain(
      "Test Abaya One: choose a size or enter your measurements.",
    );

    const custom = priceOrder(
      validOrder({
        lines: [
          { slug: "test-custom-outfit", quantity: 1, measurements: { bust: 40, length: 55 } },
        ],
      }),
      "pay",
    );
    expect(custom.ok).toBe(true);
  });

  it("charges the price of the chosen option", () => {
    const measurements = { bust: 40, length: 55 };
    const withInner = priceOrder(
      validOrder({
        lines: [
          {
            slug: "printed-abaya-set",
            quantity: 2,
            option: "With scarf and inner",
            color: "Rose",
            measurements,
          },
        ],
      }),
      "pay",
    );
    expect(withInner.ok && withInner.order.subtotal).toBe(36000);

    const withoutInner = priceOrder(
      validOrder({
        lines: [
          {
            slug: "printed-abaya-set",
            quantity: 1,
            option: "With scarf, without inner",
            color: "Mint",
            measurements,
          },
        ],
      }),
      "pay",
    );
    expect(withoutInner.ok && withoutInner.order.subtotal).toBe(15000);
  });

  it("requires a valid option only on products that have options", () => {
    const measurements = { bust: 40, length: 55 };
    const missing = validOrder({
      lines: [{ slug: "printed-abaya-set", quantity: 1, measurements }],
    });
    expect(errorsFor(missing)).toContain("Printed Abaya Set: choose an option.");

    const madeUp = validOrder({
      lines: [{ slug: "printed-abaya-set", quantity: 1, option: "Free", measurements }],
    });
    expect(errorsFor(madeUp)).toContain("Printed Abaya Set: that option isn't available.");

    const notAllowed = validOrder({
      lines: [{ slug: "sundress", quantity: 1, option: "Free", measurements }],
    });
    expect(errorsFor(notAllowed)).toContain("Sundress: that option isn't available.");
  });

  it("asks for waist instead of bust on skirts", () => {
    const withWaist = priceOrder(
      validOrder({
        lines: [
          {
            slug: "handkerchief-skirt",
            quantity: 1,
            color: "Navy Plaid",
            measurements: { waist: 30, length: 40 },
          },
        ],
      }),
      "pay",
    );
    expect(withWaist.ok && withWaist.order.subtotal).toBe(15000);
    expect(withWaist.ok && withWaist.order.lines[0].measurements?.waist).toBe(30);

    const withBust = validOrder({
      lines: [{ slug: "handkerchief-skirt", quantity: 1, measurements: { bust: 40, length: 40 } }],
    });
    expect(errorsFor(withBust).join()).toContain("enter waist and length");
  });

  it("lets customers ask for any colour", () => {
    const line = { slug: "sundress", quantity: 1, measurements: { bust: 40, length: 55 } };

    const custom = priceOrder(validOrder({ lines: [{ ...line, color: "  Wine  " }] }), "pay");
    expect(custom.ok && custom.order.lines[0].color).toBe("Wine");

    const long = priceOrder(validOrder({ lines: [{ ...line, color: "x".repeat(90) }] }), "pay");
    expect(long.ok && long.order.lines[0].color?.length).toBe(40);

    expect(errorsFor(validOrder({ lines: [line] }))).toContain("Sundress: choose a colour.");
  });

  it("needs an email to pay on the site, but not for WhatsApp orders", () => {
    const noEmail = validOrder({ customer: { name: "Test", phone: "08031234567" } });
    expect(errorsFor(noEmail).join()).toContain("email address");
    expect(errorsFor({ ...noEmail, customer: { ...noEmail.customer, email: "nope" } }).join()).toContain(
      "email address",
    );
    expect(priceOrder(noEmail, "whatsapp").ok).toBe(true);
  });

  it("rejects measurements outside the allowed range", () => {
    const order = validOrder({
      lines: [{ slug: "test-custom-outfit", quantity: 1, measurements: { bust: 0, length: 55 } }],
    });
    expect(errorsFor(order).join()).toContain("enter bust and length");
  });

  it("rejects unknown products and sizes", () => {
    expect(errorsFor(validOrder({ lines: [{ slug: "nope", quantity: 1 }] }))).toContain(
      "An item in your cart is no longer available.",
    );
    const badSize = validOrder({
      lines: [{ slug: "test-abaya-one", quantity: 1, size: "XXXL", color: "Cream" }],
    });
    expect(errorsFor(badSize).join()).toContain("size XXXL");
  });

  it("rejects invalid quantities", () => {
    for (const quantity of [0, -1, 1.5, 21, "2"]) {
      const order = validOrder({
        lines: [{ slug: "test-abaya-one", quantity: quantity as number, size: "M", color: "Cream" }],
      });
      expect(errorsFor(order).join()).toContain("quantity");
    }
  });

  it("requires the policy to be accepted", () => {
    expect(errorsFor(validOrder({ policyAccepted: false }))).toContain(
      "Accept the returns and adjustments policy.",
    );
  });

  it("survives malformed input", () => {
    for (const input of [null, undefined, "text", 5, [], { lines: "x" }, { lines: [null, 1] }]) {
      expect(priceOrder(input, "pay").ok).toBe(false);
    }
  });
});

describe("isValidPhone", () => {
  it("accepts Nigerian formats", () => {
    for (const phone of ["09027500239", "+2349027500239", "2349027500239", "0803-123-4567"]) {
      expect(isValidPhone(phone)).toBe(true);
    }
  });

  it("rejects anything else", () => {
    for (const phone of ["12345", "0902750023", "090275002399", "01234567890", "abc"]) {
      expect(isValidPhone(phone)).toBe(false);
    }
  });
});
