import { MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { Photo } from "@/components/Photo";
import { business } from "@/data/business";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact",
  description: "Call or WhatsApp AOT.ng in Ilorin, Kwara State.",
};

export default function ContactPage() {
  return (
    <div className="container-page grid items-center gap-10 py-10 md:grid-cols-2 lg:gap-16 lg:py-16">
      <div>
        <h1 className="text-4xl sm:text-5xl">Contact</h1>
        <p className="mt-4 text-lg text-muted">
          Questions about a piece, a custom outfit or your order? We&apos;d love to hear from you.
        </p>

        <ul className="mt-8 space-y-6">
          <li className="flex gap-4">
            <MessageCircle size={24} strokeWidth={1.25} className="shrink-0 text-mocha" aria-hidden="true" />
            <div>
              <h2 className="font-sans text-base font-medium">WhatsApp</h2>
              <a
                href={whatsappLink("Hello AOT.ng, I have a question.")}
                className="text-mocha underline underline-offset-4"
              >
                Chat with us on {business.phoneDisplay}
              </a>
            </div>
          </li>
          <li className="flex gap-4">
            <Phone size={24} strokeWidth={1.25} className="shrink-0 text-mocha" aria-hidden="true" />
            <div>
              <h2 className="font-sans text-base font-medium">Phone</h2>
              <a href={`tel:${business.phoneTel}`} className="text-mocha underline underline-offset-4">
                {business.phoneDisplay}
              </a>
            </div>
          </li>
          <li className="flex gap-4">
            <MapPin size={24} strokeWidth={1.25} className="shrink-0 text-mocha" aria-hidden="true" />
            <div>
              <h2 className="font-sans text-base font-medium">Pickup address</h2>
              <p className="text-muted">{business.pickupAddress}</p>
            </div>
          </li>
        </ul>
      </div>
      <Photo
        src="/photos/contact.webp"
        alt="A woman in a hijab hanging clothes on a rail"
        className="aspect-[4/5] rounded-t-[10rem]"
      />
    </div>
  );
}
