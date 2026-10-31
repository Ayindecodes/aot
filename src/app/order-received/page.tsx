import type { Metadata } from "next";
import { OrderReceived } from "@/components/OrderReceived";

export const metadata: Metadata = {
  title: "Order Received",
  robots: { index: false },
};

export default function OrderReceivedPage() {
  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="text-4xl md:text-5xl">Thank You</h1>
      <OrderReceived />
    </div>
  );
}
