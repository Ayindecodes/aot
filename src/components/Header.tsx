"use client";

import { Menu, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCart } from "@/lib/cart";
import { Logo } from "./Logo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/custom-sewing", label: "Custom Sewing" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

function SearchForm({ id, onSearch }: { id: string; onSearch?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
    onSearch?.();
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative">
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        id={id}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products"
        className="h-10 w-full rounded-full border border-taupe bg-white pl-4 pr-10 text-base lg:text-sm"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center text-mocha"
      >
        <Search size={18} strokeWidth={1.5} />
      </button>
    </form>
  );
}

export function Header() {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-cream bg-ivory">
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-20">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="-ml-2 flex h-11 w-11 items-center justify-center lg:hidden"
        >
          {open ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
        </button>

        <Link href="/" aria-label="AOT.ng home" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-[0.9375rem]">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`hover:text-mocha ${isActive(link.href) ? "text-mocha underline decoration-rose underline-offset-8" : ""}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden w-52 lg:block">
            <SearchForm id="header-search" />
          </div>
          <Link
            href="/cart"
            aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
            className="relative -mr-2 flex h-11 w-11 items-center justify-center"
            onClick={() => setOpen(false)}
          >
            <ShoppingBag size={22} strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-mocha px-1 text-xs text-ivory">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div
        id="mobile-menu"
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-200 lg:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="container-page border-t border-cream py-4">
            <SearchForm id="mobile-search" onSearch={() => setOpen(false)} />
            <nav aria-label="Mobile" className="mt-2">
              <ul>
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={`block py-2.5 ${isActive(link.href) ? "text-mocha" : ""}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
