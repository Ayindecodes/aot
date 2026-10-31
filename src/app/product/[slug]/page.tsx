import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Price } from "@/components/Price";
import { ProductCard } from "@/components/ProductCard";
import { ProductView } from "@/components/ProductView";
import { getCategory, getProduct, getRelatedProducts, products } from "@/data/products";
import { availabilityLabel, formatNaira } from "@/lib/catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  const description = product.price
    ? `${formatNaira(product.price)}. ${product.description}`
    : product.description;
  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.images[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const details = [
    { label: "Fabric", value: product.fabric },
    { label: "Fit and styling", value: product.fit },
    { label: "Care", value: product.care },
  ].filter((detail) => detail.value);

  return (
    <div className="container-page py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/shop" className="hover:underline">
          Shop
        </Link>
        {category && (
          <>
            {" / "}
            <Link href={`/collections/${category.slug}`} className="hover:underline">
              {category.name}
            </Link>
          </>
        )}
      </nav>

      <ProductView
        product={product}
        summary={
          <>
            <h1 className="text-4xl md:text-5xl">{product.name}</h1>
            <Price product={product} className="mt-3 text-xl" />
            <p className="mt-2 font-medium text-mocha">{availabilityLabel(product.availability)}</p>
          </>
        }
        details={
          <div className="mt-8 border-t border-cream pt-6">
            <h2 className="font-sans text-base font-medium">Description</h2>
            <p className="mt-2 leading-relaxed text-muted">{product.description}</p>
            {details.map((detail) => (
              <div key={detail.label} className="mt-4">
                <h2 className="font-sans text-base font-medium">{detail.label}</h2>
                <p className="mt-1 leading-relaxed text-muted">{detail.value}</p>
              </div>
            ))}
          </div>
        }
      />

      <section className="mt-16">
        <h2 className="text-3xl md:text-4xl">You May Also Like</h2>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">
          {getRelatedProducts(product).map((related) => (
            <ProductCard key={related.slug} product={related} />
          ))}
        </div>
      </section>
    </div>
  );
}
