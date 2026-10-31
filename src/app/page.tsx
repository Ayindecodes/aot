import {
  CalendarHeart,
  Gem,
  PencilRuler,
  Scissors,
  Shirt,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Photo } from "@/components/Photo";
import { ProductCard } from "@/components/ProductCard";
import { business } from "@/data/business";
import { getActiveCategories, products } from "@/data/products";
import { isOrderable } from "@/lib/catalog";
import { whatsappLink } from "@/lib/whatsapp";

const customOutfitLink = whatsappLink("Hello AOT.ng, I would like to request a custom outfit.");

const highlights: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: PencilRuler,
    title: "Thoughtful Designs",
    text: "Graceful silhouettes made with modest dressing in mind.",
  },
  {
    icon: Scissors,
    title: "Custom Sewing",
    text: "Share your design and preferences, and we'll sew it for you.",
  },
  {
    icon: Shirt,
    title: "Ready-to-Wear Pieces",
    text: "Finished pieces you can order in the available sizes.",
  },
  {
    icon: Gem,
    title: "Attention to Detail",
    text: "Talk through the finishing details with us before you order.",
  },
  {
    icon: CalendarHeart,
    title: "Style for Different Occasions",
    text: "Looks for your everyday and your special days.",
  },
];

export default function HomePage() {
  const featured = products.filter((product) => product.featured).slice(0, 4);
  const collections = getActiveCategories().slice(0, 6);
  // The brief rules out made-up social posts, so this only shows AOT.ng's own photos.
  const inspiration = products
    .filter((product) => isOrderable(product.availability) && product.images[0])
    .slice(0, 4);

  return (
    <>
      <section className="container-page grid items-center gap-6 py-6 md:grid-cols-2 md:gap-10 md:py-10 lg:gap-16 lg:py-16">
        <div className="order-2 md:order-1">
          <p className="font-serif text-xl text-mocha">{business.tagline}</p>
          <h1 className="mt-3 text-5xl sm:text-6xl md:text-5xl lg:text-7xl">Elegance in Every Layer.</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
            Discover modest pieces designed to celebrate your individuality, elevate your everyday
            style, and make every occasion feel special.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/shop" className="btn btn-primary">
              Explore Collection
            </Link>
            <a href={customOutfitLink} className="btn btn-secondary">
              Request a Custom Outfit
            </a>
          </div>
        </div>
        <Photo
          src="/photos/hero.webp"
          alt="A woman in a hijab and an embroidered oxblood gown"
          eager
          className="order-1 aspect-[5/4] rounded-t-[8rem] object-[50%_12%] sm:rounded-t-[12rem] md:order-2 md:aspect-[4/5]"
        />
      </section>
    </>
  );
}
