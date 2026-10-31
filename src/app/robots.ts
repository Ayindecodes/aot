import type { MetadataRoute } from "next";
import { business } from "@/data/business";

export const dynamic = "force-static";

// Search engines stay out until the site is ready to launch.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: business.openToSearchEngines
      ? { userAgent: "*", allow: "/" }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${business.siteUrl}/sitemap.xml`,
  };
}
