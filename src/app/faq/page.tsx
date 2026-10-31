import type { Metadata } from "next";
import Link from "next/link";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about ordering, payment, delivery and custom sewing at AOT.ng.",
};

const questions = [
  {
    question: "How do I place an order?",
    answer:
      "Add your pieces to the cart and go to checkout. You can pay on the website by bank transfer and upload your receipt, or continue on WhatsApp.",
  },
  {
    question: "How do I pay?",
    answer:
      "Transfer the total to the account shown at checkout, then upload your receipt. We'll check your payment and contact you.",
  },
  {
    question: "How will I know what's happening with my order?",
    answer:
      "We'll email you when we receive your order and when we confirm your payment. We'll email you again when it's processed, and when it's ready or on its way.",
  },
  {
    question: "How much is delivery?",
    answer:
      "Delivery is free inside Unilorin and ₦3,000 anywhere else in Ilorin. Pickup is free. For orders outside Ilorin, we'll agree the fee with you on WhatsApp.",
  },
  {
    question: "Where can I pick up my order?",
    answer: `Our pickup address is ${business.pickupAddress}.`,
  },
  {
    question: "What if my size isn't listed?",
    answer:
      "Many pieces can be made to your measurements. Choose that option on the product page and enter your bust and length.",
  },
  {
    question: "How do custom orders work?",
    answer:
      "Tell us what you have in mind and pay in full on the website, or continue on WhatsApp if you prefer.",
  },
  {
    question: "Can I return an item?",
    answer: "We don't accept returns, but we can make adjustments.",
  },
];

export default function FaqPage() {
  return (
    <div className="container-page max-w-3xl py-10 lg:py-16">
      <h1 className="text-4xl sm:text-5xl">Frequently Asked Questions</h1>
      <div className="mt-8 divide-y divide-cream border-y border-cream">
        {questions.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="cursor-pointer font-serif text-xl">{item.question}</summary>
            <p className="mt-2 leading-relaxed text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
      <p className="mt-6 text-muted">
        See the full{" "}
        <Link href="/policies/returns" className="text-mocha underline underline-offset-4">
          returns and adjustments policy
        </Link>
        .
      </p>
    </div>
  );
}
