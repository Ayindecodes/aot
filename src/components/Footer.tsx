import Link from "next/link";
import { business } from "@/data/business";
import { getActiveCategories } from "@/data/products";
import { LogoEmblem } from "./Logo";

const companyLinks = [
  { href: "/custom-sewing", label: "Custom Sewing" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

const policyLinks = [
  { href: "/policies/returns", label: "Returns and Adjustments" },
  { href: "/policies/delivery", label: "Delivery and Pickup" },
  { href: "/policies/privacy", label: "Privacy" },
  { href: "/policies/terms", label: "Terms" },
];

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="font-sans text-sm font-medium text-taupe">{title}</h2>
      <ul className="mt-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="block py-1.5 hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const shopLinks = [
    { href: "/shop", label: "All Products" },
    ...getActiveCategories().map((category) => ({
      href: `/collections/${category.slug}`,
      label: category.name,
    })),
  ];

  return (
    <footer className="mt-auto bg-espresso text-ivory">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 sm:col-span-3 lg:col-span-2">
          <LogoEmblem className="h-28 w-28" />
          <p className="mt-2 font-serif text-lg">{business.tagline}</p>
          <ul className="mt-4 space-y-1 text-sm">
            <li>
              <a href={`tel:${business.phoneTel}`} className="hover:underline">
                {business.phoneDisplay}
              </a>{" "}
              (calls and WhatsApp)
            </li>
            <li>{business.pickupAddress}</li>
          </ul>
        </div>
        <LinkColumn title="Shop" links={shopLinks} />
        <LinkColumn title="AOT.ng" links={companyLinks} />
        <LinkColumn title="Policies" links={policyLinks} />
      </div>
      <div className="border-t border-mocha">
        <div className="container-page flex flex-wrap items-center justify-between gap-x-6 py-2 text-sm text-taupe">
          <p className="py-2">
            © {new Date().getFullYear()} {business.name}
          </p>
          <p>
            Built by{" "}
            <a
              href="mailto:techblazecodes@gmail.com"
              className="inline-flex min-h-10 items-center text-ivory underline underline-offset-4"
            >
              techblazecodes
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
