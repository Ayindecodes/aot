import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-4xl md:text-5xl">Your Cart</h1>
      <CartView />
    </div>
  );
}
