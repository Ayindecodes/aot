import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/Photo";
import { getActiveCategories, products } from "@/data/products";

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore AOT.ng collections.",
};

export default function CollectionsPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-4xl md:text-5xl">Collections</h1>
      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6">
        {getActiveCategories().map((category) => {
          const count = products.filter((product) => product.category === category.slug).length;
          return (
            <li key={category.slug}>
              <Link href={`/collections/${category.slug}`} className="group block">
                {category.image && (
                  <Photo
                    src={category.image}
                    alt={category.name}
                    className="aspect-[4/5] rounded-t-[6rem] object-top md:rounded-t-[10rem]"
                  />
                )}
                <h2 className="mt-3 text-2xl group-hover:text-mocha">{category.name}</h2>
                <p className="text-sm text-muted">
                  {count} {count === 1 ? "piece" : "pieces"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
