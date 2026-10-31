import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/Photo";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Custom Sewing",
  description: "Request a custom-made modest outfit from AOT.ng.",
};

const steps = [
  {
    title: "Share your idea",
    text: "Send us your preferred design, fabric, colours and finishing details on WhatsApp.",
  },
  {
    title: "Give your measurements",
    text: "We'll need your bust and length, plus any notes about how you like your pieces to fit.",
  },
  {
    title: "Confirm the details",
    text: "We'll talk through your outfit with you and agree what's being made.",
  },
  {
    title: "Pay and we'll begin",
    text: "Pay in full on the website, or continue on WhatsApp if you prefer.",
  },
];

export default function CustomSewingPage() {
  return (
    <>
      <section className="container-page grid items-center gap-8 py-10 md:grid-cols-2 lg:gap-16 lg:py-16">
        <div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl">Made for You. Designed Your Way.</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Have a design in mind? Let AOT.ng bring your vision to life with custom-made modest
            pieces tailored to your preferences.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={whatsappLink("Hello AOT.ng, I would like to request a custom outfit.")}
              className="btn btn-primary"
            >
              Request a Custom Outfit
            </a>
            <Link href="/collections/custom-outfits" className="btn btn-secondary">
              View Custom Outfits
            </Link>
          </div>
        </div>
        <Photo
          src="/photos/custom-page.webp"
          alt="A tailor threading a sewing machine"
          className="aspect-[5/4] rounded-t-[10rem]"
        />
      </section>

      <section className="bg-cream">
        <div className="section container-page">
          <h2 className="text-4xl md:text-5xl">How It Works</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title}>
                <p className="font-serif text-3xl text-mocha">{index + 1}</p>
                <h3 className="mt-2 text-xl">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
