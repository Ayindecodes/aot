import type { Metadata } from "next";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How AOT.ng handles your order details.",
};

export default function PrivacyPage() {
  return (
    <>
      <h1 className="mb-6 text-4xl sm:text-5xl">Privacy</h1>
      <h2>What we collect</h2>
      <p>
        When you order, we collect your name, phone number, email address, delivery address, any
        measurements you enter and your payment receipt.
      </p>
      <h2>How we use it</h2>
      <p>
        We use these details only to process and deliver your order, and to contact you about it,
        including emails about its progress. We don&apos;t sell them.
      </p>
      <h2>Where it goes</h2>
      <p>
        Your order and receipt are sent to us by email through our email provider, Resend, which
        also sends your order updates. The website itself doesn&apos;t keep a copy. If you continue
        on WhatsApp, your order details are shared through WhatsApp.
      </p>
      <h2>Your cart</h2>
      <p>Your cart is saved in your own browser, so it&apos;s there when you come back.</p>
      <h2>Questions</h2>
      <p>
        To ask about your details or have them removed, message us on WhatsApp on{" "}
        {business.phoneDisplay}.
      </p>
    </>
  );
}
