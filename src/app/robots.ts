import type { MetadataRoute } from "next";

import { siteConfig } from "../shared/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: ["/admin"],
    },
    sitemap: `${siteConfig.url.replace(/\/$/, "")}/sitemap.xml`,
    host: siteConfig.url,
  };
}
