import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShopBrowser } from "@/components/ShopBrowser";
import { getActiveCategories, getCategory, products } from "@/data/products";

export const dynamicParams = false;

export function generateStaticParams() {
  return getActiveCategories().map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  return category
    ? { title: category.name, description: `Shop ${category.name} from AOT.ng.` }
    : {};
}

export default async function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  return (
    <div className="container-page py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/collections" className="hover:underline">
          Collections
        </Link>{" "}
        / {category.name}
      </nav>
      <h1 className="mt-2 text-4xl md:text-5xl">{category.name}</h1>
      <Suspense>
        <ShopBrowser
          products={products.filter((product) => product.category === slug)}
          showCategoryFilter={false}
        />
      </Suspense>
    </div>
  );
}
