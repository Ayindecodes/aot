import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for ordering from AOT.ng.",
};

export default function TermsPage() {
  return (
    <>
      <h1 className="mb-6 text-4xl sm:text-5xl">Terms</h1>
      <h2>Prices</h2>
      <p>All prices are in Nigerian naira. The price you pay is the one shown at checkout.</p>
      <h2>Payment</h2>
      <p>
        Your order is confirmed once we&apos;ve checked your transfer against your receipt. We may
        cancel an order if we can&apos;t confirm the payment.
      </p>
      <h2>Availability</h2>
      <p>
        Limited pieces are sold while they last. If a piece sells out before we confirm your order,
        we&apos;ll contact you about it.
      </p>
      <h2>Custom orders</h2>
      <p>
        Custom pieces are made from the details and measurements you give us, so please check them
        carefully before you order.
      </p>
      <h2>Returns</h2>
      <p>
        We don&apos;t accept returns. See our{" "}
        <Link href="/policies/returns" className="text-mocha underline underline-offset-4">
          returns and adjustments policy
        </Link>
        .
      </p>
    </>
  );
}
