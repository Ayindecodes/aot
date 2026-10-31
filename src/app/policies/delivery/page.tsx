import type { Metadata } from "next";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: "Delivery and Pickup",
  description: "AOT.ng delivery fees and pickup details.",
};

export default function DeliveryPage() {
  return (
    <>
      <h1 className="mb-6 text-4xl sm:text-5xl">Delivery and Pickup</h1>
      <h2>Delivery fees</h2>
      <ul>
        <li>Inside Unilorin: free</li>
        <li>Anywhere else in Ilorin: ₦3,000</li>
        <li>Outside Ilorin: agreed with you on WhatsApp before you pay</li>
      </ul>
      <h2>Pickup</h2>
      <p>Pickup is free from {business.pickupAddress}.</p>
      <h2>Your details</h2>
      <p>
        Please give a full address and a working phone number at checkout, so we can reach you about
        your order.
      </p>
    </>
  );
}
