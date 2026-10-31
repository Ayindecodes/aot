import type { MetadataRoute } from "next";
import { business } from "@/data/business";
import { getActiveCategories, products } from "@/data/products";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/shop",
    "/collections",
    "/custom-sewing",
    "/about",
    "/contact",
    "/faq",
    "/policies/returns",
    "/policies/delivery",
    "/policies/privacy",
    "/policies/terms",
    ...getActiveCategories().map((category) => `/collections/${category.slug}`),
    ...products.map((product) => `/product/${product.slug}`),
  ];
  return paths.map((path) => ({ url: `${business.siteUrl}${path}` }));
}
