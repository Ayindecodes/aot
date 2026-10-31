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

      <section className="bg-white">
        <div className="section container-page">
          <h2 className="text-4xl md:text-5xl">Featured Collections</h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6">
            {collections.map((category) => (
              <li key={category.slug}>
                <Link href={`/collections/${category.slug}`} className="group block">
                  {category.image && (
                    <Photo
                      src={category.image}
                      alt={category.name}
                      className="aspect-[4/5] rounded-t-[6rem] object-top md:rounded-t-[10rem]"
                    />
                  )}
                  <h3 className="mt-3 text-2xl group-hover:text-mocha">{category.name}</h3>
                  <span className="mt-1 inline-block text-sm text-mocha underline underline-offset-4">
                    Explore
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section container-page">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-4xl md:text-5xl">Pieces You&apos;ll Love</h2>
          <Link
            href="/shop"
            className="inline-flex min-h-10 shrink-0 items-center text-sm font-medium text-mocha underline underline-offset-4"
          >
            View all
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-espresso text-ivory">
        <div className="section container-page grid items-center gap-10 md:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-4xl md:text-5xl">Made for You. Designed Your Way.</h2>
            <p className="mt-5 text-lg leading-relaxed">
              Have a design in mind? Let AOT.ng bring your vision to life with custom-made modest
              pieces tailored to your preferences.
            </p>
            <p className="mt-4 leading-relaxed text-cream">
              Tell us about your preferred designs, fabrics, colours, measurements, and finishing
              details, and we&apos;ll talk it through with you.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={customOutfitLink}
                className="btn bg-ivory text-espresso hover:bg-cream"
              >
                Request a Custom Outfit
              </a>
              <Link
                href="/custom-sewing"
                className="btn border border-ivory text-ivory hover:bg-ivory hover:text-espresso"
              >
                How It Works
              </Link>
            </div>
          </div>
          <Photo
            src="/photos/custom-home.webp"
            alt="A tape measure and scissors on satin"
            className="aspect-[5/4] rounded-lg"
          />
        </div>
      </section>

      <section className="section container-page grid items-center gap-10 md:grid-cols-2 lg:gap-16">
        <Photo
          src="/photos/story.webp"
          alt="A smiling woman in a black abaya and hijab"
          className="aspect-[5/4] rounded-b-[10rem] object-[50%_16%] md:order-2"
        />
        <div className="md:order-1">
          <h2 className="text-4xl md:text-5xl">Modesty Is Personal. So Is Style.</h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            At AOT.ng, we believe that modest fashion should feel as beautiful as it looks. We bring
            together thoughtful designs, graceful silhouettes, and a love for personal style to
            create pieces that help every woman express herself with confidence.
          </p>
          <Link
            href="/about"
            className="mt-4 inline-flex min-h-10 items-center font-medium text-mocha underline underline-offset-4"
          >
            Read our story
          </Link>
        </div>
      </section>

      <section className="bg-cream">
        <div className="section container-page">
          <h2 className="text-4xl md:text-5xl">Why Choose AOT.ng?</h2>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon size={26} strokeWidth={1.25} className="text-mocha" aria-hidden="true" />
                <h3 className="mt-3 text-xl">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
