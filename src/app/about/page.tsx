import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/Photo";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: "About Us",
  description: "AOT.ng is a modest fashion brand based in Ilorin, Kwara State.",
};

export default function AboutPage() {
  return (
    <div className="container-page grid items-center gap-8 py-10 md:grid-cols-2 lg:gap-16 lg:py-16">
      <div>
        <p className="font-serif text-xl text-mocha">{business.tagline}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl">Modesty Is Personal. So Is Style.</h1>
        <div className="prose-page mt-6 text-lg">
          <p>
            At AOT.ng, we believe that modest fashion should feel as beautiful as it looks. We bring
            together thoughtful designs, graceful silhouettes, and a love for personal style to
            create pieces that help every woman express herself with confidence.
          </p>
          <p>
            Based in Ilorin, Kwara State, we offer ready-to-wear pieces and custom sewing, so you
            can choose something finished or have it made your way.
          </p>
        </div>
        <Link href="/shop" className="btn btn-primary mt-2">
          Explore Collection
        </Link>
      </div>
      <Photo
        src="/photos/about.webp"
        alt="A woman in a hijab with her eyes closed"
        className="aspect-[4/5] rounded-b-[10rem]"
      />
    </div>
  );
}
