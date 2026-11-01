"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { business, deliveryOptions, getDeliveryOption } from "@/data/business";
import { toOrderLine, useCart, useHydrated } from "@/lib/cart";
import { formatNaira } from "@/lib/catalog";
import {
  describeLineOptions,
  LAST_ORDER_KEY,
  MAX_RECEIPT_BYTES,
  priceLines,
  priceOrder,
  type OrderInput,
  type PricedOrder,
} from "@/lib/order";
import { shrinkReceipt } from "@/lib/receipt";
import { orderMessage, whatsappLink } from "@/lib/whatsapp";
import { BotCheck } from "./BotCheck";
import { CopyButton } from "./CopyButton";

function ErrorList({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <ul role="alert" className="space-y-1 rounded-lg bg-white p-4 text-sm text-error">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}

function PaymentRow({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: string;
  copyValue?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-cream py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="text-lg font-medium">{value}</p>
      </div>
      {copyValue && <CopyButton value={copyValue} label={label.toLowerCase()} />}
    </div>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { lines, clear } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryOption, setDeliveryOption] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [paidOrder, setPaidOrder] = useState<PricedOrder | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [botCheckAttempt, setBotCheckAttempt] = useState(0);

  const input: OrderInput = {
    lines: lines.map(toOrderLine),
    customer: { name, phone, email },
    delivery: { option: deliveryOption, address, landmark },
    policyAccepted,
  };

  const selectedDelivery = getDeliveryOption(deliveryOption);
  const pricedLines = priceLines(input.lines, []);
  const subtotal = pricedLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const total = subtotal + (selectedDelivery?.fee ?? 0);
  const whatsappOnly = selectedDelivery?.fee === null;

  function goToPayment() {
    const result = priceOrder(input, "pay");
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setPaidOrder(result.order);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function continueOnWhatsApp() {
    const result = priceOrder(input, "whatsapp");
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    window.open(whatsappLink(orderMessage(result.order)), "_blank", "noopener");
  }

  async function submitOrder() {
    if (!receipt) {
      setErrors(["Upload your payment receipt."]);
      return;
    }

    setSubmitting(true);
    setErrors([]);
    setSendFailed(false);

    try {
      const file = await shrinkReceipt(receipt);
      if (file.size > MAX_RECEIPT_BYTES) {
        setErrors(["Your receipt is too large. The limit is 5 MB."]);
        return;
      }

      const form = new FormData();
      form.append("order", JSON.stringify(input));
      form.append("receipt", file);
      form.append("website", website);
      form.append("cf-turnstile-response", botToken);

      const response = await fetch("/api/order", { method: "POST", body: form });
      const body = (await response.json().catch(() => null)) as {
        orderNumber?: string;
        errors?: string[];
      } | null;

      if (!response.ok || !body?.orderNumber) {
        setErrors(body?.errors ?? ["We couldn't send your order. Please try again."]);
        setSendFailed(response.status >= 500 || response.status === 403);
        // A bot check token works once, so any retry needs a fresh one.
        setBotToken("");
        setBotCheckAttempt((attempt) => attempt + 1);
        return;
      }

      sessionStorage.setItem(
        LAST_ORDER_KEY,
        JSON.stringify({ orderNumber: body.orderNumber, order: paidOrder }),
      );
      setCompleted(true);
      clear();
      router.push("/order-received");
    } catch {
      setErrors(["We couldn't reach the website. Check your connection and try again."]);
      setSendFailed(true);
      setBotToken("");
      setBotCheckAttempt((attempt) => attempt + 1);
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) return <p className="mt-8 text-muted">Loading checkout...</p>;

  if (completed) return <p className="mt-8 text-muted">Opening your order...</p>;

  if (lines.length === 0) {
    return (
      <div className="mt-8">
        <p className="text-muted">Your cart is empty.</p>
        <Link href="/shop" className="btn btn-primary mt-5">
          Shop the Collection
        </Link>
      </div>
    );
  }

  if (paidOrder) {
    return (
      <div className="mt-6 max-w-xl space-y-6">
        <section className="rounded-lg bg-white p-6">
          <h2 className="text-2xl">1. Make your transfer</h2>
          <p className="mt-1 text-sm text-muted">
            Transfer the exact amount below, then upload your receipt.
          </p>
          <div className="mt-3">
            <PaymentRow
              label="Amount"
              value={formatNaira(paidOrder.total)}
              copyValue={String(paidOrder.total)}
            />
            <PaymentRow
              label="Account number"
              value={business.bank.accountNumber}
              copyValue={business.bank.accountNumber}
            />
            <PaymentRow label="Bank" value={business.bank.name} />
            <PaymentRow label="Account name" value={business.bank.accountName} />
          </div>
        </section>

        <section className="rounded-lg bg-white p-6">
          <h2 className="text-2xl">2. Upload your receipt</h2>
          <label htmlFor="receipt" className="label mt-4">
            Payment receipt (image or PDF, up to 5 MB)
          </label>
          <input
            id="receipt"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
            className="field"
          />
        </section>

        <BotCheck
          key={botCheckAttempt}
          onToken={setBotToken}
          onError={() => setSendFailed(true)}
        />

        <ErrorList errors={errors} />

        {sendFailed && (
          <a
            href={whatsappLink(orderMessage(paidOrder))}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary w-full"
          >
            Send this order on WhatsApp instead
          </a>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={submitOrder}
            disabled={submitting || !botToken}
            className="btn btn-primary"
          >
            {submitting ? "Submitting..." : "Submit Order"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPaidOrder(null);
              setErrors([]);
              setSendFailed(false);
            }}
            disabled={submitting}
            className="btn btn-secondary"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 lg:grid lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-12">
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl">Your Details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">
                Full name
              </label>
              <input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="phone" className="label">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="field"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field"
              />
              <p className="mt-1 text-sm text-muted">We&apos;ll send your order updates here.</p>
            </div>
          </div>
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="website">Leave this empty</label>
            <input
              id="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl">Delivery or Pickup</h2>
          <div className="mt-4 space-y-2">
            {deliveryOptions.map((option) => (
              <label
                key={option.id}
                className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border bg-white px-4 py-2 ${deliveryOption === option.id ? "border-mocha" : "border-taupe"}`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="delivery"
                    value={option.id}
                    checked={deliveryOption === option.id}
                    onChange={() => setDeliveryOption(option.id)}
                    className="h-5 w-5 accent-mocha"
                  />
                  {option.label}
                </span>
                <span className="shrink-0 text-sm font-medium">
                  {option.fee === null
                    ? "Agreed on WhatsApp"
                    : option.fee === 0
                      ? "Free"
                      : formatNaira(option.fee)}
                </span>
              </label>
            ))}
          </div>

          {selectedDelivery?.requiresAddress && (
            <div className="mt-4 grid gap-4">
              <div>
                <label htmlFor="address" className="label">
                  Delivery address
                </label>
                <textarea
                  id="address"
                  rows={2}
                  autoComplete="street-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="landmark" className="label">
                  Nearest landmark (optional)
                </label>
                <input
                  id="landmark"
                  value={landmark}
                  onChange={(event) => setLandmark(event.target.value)}
                  className="field"
                />
              </div>
            </div>
          )}

          {deliveryOption === "pickup" && (
            <p className="mt-3 text-sm text-muted">Pickup address: {business.pickupAddress}</p>
          )}
          {whatsappOnly && (
            <p className="mt-3 text-sm text-muted">
              We&apos;ll agree the delivery fee with you on WhatsApp before you pay.
            </p>
          )}
        </section>
      </div>

      <aside className="mt-8 space-y-4 rounded-lg bg-white p-6 lg:mt-0">
        <h2 className="text-2xl">Your Order</h2>
        <ul className="space-y-3 text-sm">
          {pricedLines.map((line) => {
            const options = describeLineOptions(line);
            return (
              <li
                key={`${line.slug}-${options}`}
                className="flex justify-between gap-3"
              >
                <span>
                  {line.quantity} x {line.name}
                  {options && <span className="block text-muted">{options}</span>}
                </span>
                <span className="shrink-0">{formatNaira(line.lineTotal)}</span>
              </li>
            );
          })}
        </ul>
        <dl className="space-y-1 border-t border-cream pt-3">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatNaira(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>
              {!selectedDelivery
                ? "Choose an option"
                : selectedDelivery.fee === null
                  ? "To be agreed"
                  : selectedDelivery.fee === 0
                    ? "Free"
                    : formatNaira(selectedDelivery.fee)}
            </dd>
          </div>
          <div className="flex justify-between text-lg font-medium">
            <dt>Total</dt>
            <dd>{formatNaira(total)}</dd>
          </div>
        </dl>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={policyAccepted}
            onChange={(event) => setPolicyAccepted(event.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-mocha"
          />
          <span>
            I understand there are no returns, only adjustments, as set out in the{" "}
            <Link
              href="/policies/returns"
              target="_blank"
              className="text-mocha underline underline-offset-2"
            >
              returns and adjustments policy
            </Link>
            .
          </span>
        </label>

        <ErrorList errors={errors} />

        <div className="space-y-3">
          {!whatsappOnly && (
            <button type="button" onClick={goToPayment} className="btn btn-primary w-full">
              Proceed to Payment
            </button>
          )}
          <button
            type="button"
            onClick={continueOnWhatsApp}
            className={`btn w-full ${whatsappOnly ? "btn-primary" : "btn-secondary"}`}
          >
            Continue on WhatsApp
          </button>
        </div>
      </aside>
    </div>
  );
}
