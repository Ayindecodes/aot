"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { formatNaira } from "@/lib/catalog";
import { LAST_ORDER_KEY, type PricedOrder } from "@/lib/order";
import { orderMessage, whatsappLink } from "@/lib/whatsapp";

const noSubscription = () => () => {};

function parseOrder(stored: string | null) {
  if (!stored) return null;
  try {
    return JSON.parse(stored) as { orderNumber: string; order: PricedOrder };
  } catch {
    return null;
  }
}

export function OrderReceived() {
  const stored = useSyncExternalStore(
    noSubscription,
    () => sessionStorage.getItem(LAST_ORDER_KEY),
    () => null,
  );
  const received = parseOrder(stored);

  if (!received) {
    return (
      <div className="mt-6">
        <p className="text-muted">There&apos;s no recent order to show here.</p>
        <Link href="/shop" className="btn btn-primary mt-5">
          Shop the Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg bg-white p-6">
      <p className="text-sm text-muted">Order number</p>
      <p className="text-2xl font-medium">{received.orderNumber}</p>
      <p className="mt-3">Total: {formatNaira(received.order.total)}</p>
      <p className="mt-4 leading-relaxed text-muted">
        We&apos;ve received your order and receipt. We&apos;ll check your payment and email you at{" "}
        {received.order.customer.email ?? received.order.customer.phone} as your order moves along.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          href={whatsappLink(orderMessage(received.order, received.orderNumber))}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Send Details on WhatsApp
        </a>
        <Link href="/shop" className="btn btn-secondary">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
