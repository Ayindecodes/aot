import type { Metadata } from "next";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: "Returns and Adjustments",
  description: "AOT.ng does not accept returns, but adjustments can be made.",
};

export default function ReturnsPage() {
  return (
    <>
      <h1 className="mb-6 text-4xl sm:text-5xl">Returns and Adjustments</h1>
      <h2>No returns</h2>
      <p>All sales are final, and we don&apos;t accept returns or exchanges.</p>
      <h2>Adjustments</h2>
      <p>
        If your piece doesn&apos;t fit quite right, we&apos;ll adjust it at no charge. Message us on
        WhatsApp on {business.phoneDisplay} within 3 days of receiving it. You can bring it to{" "}
        {business.pickupAddress}, or cover the delivery cost.
      </p>
      <h2>Wrong or faulty items</h2>
      <p>
        If we send the wrong item or it arrives with a fault, send us photos on WhatsApp within 3
        days of receiving it. We&apos;ll fix or replace it at no cost, including delivery. If we
        can&apos;t do either, we&apos;ll refund what you paid for that item.
      </p>
    </>
  );
}
