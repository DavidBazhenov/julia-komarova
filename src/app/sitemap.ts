import type { MetadataRoute } from "next";

import { listArtworks } from "@/features/artworks";
import { buildAbsoluteUrl } from "../shared/lib/metadata";
import { locales } from "../shared/lib/i18n";

const routes = ["/", "/gallery", "/about", "/contacts"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const artworks = await listArtworks({
    publishedOnly: true,
    limit: 500,
    locale: "ru",
  });

  const staticRoutes = locales.flatMap((locale) =>
    routes.map((route) => ({
      url: buildAbsoluteUrl(route === "/" ? `/${locale}` : `/${locale}${route}`),
      lastModified: new Date(),
      changeFrequency: (route === "/" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: route === "/" ? 1 : 0.7,
    })),
  );

  const artworkRoutes = locales.flatMap((locale) =>
    artworks.map((artwork) => ({
      url: buildAbsoluteUrl(`/${locale}/gallery/${artwork.slug}`),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  );

  return [...staticRoutes, ...artworkRoutes];
}
