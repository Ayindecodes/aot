import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-4xl md:text-5xl">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
