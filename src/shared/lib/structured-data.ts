import { buildAbsoluteUrl } from "./metadata";
import type { SiteLocale } from "./i18n";

type Thing = Record<string, unknown>;

export function buildArtistStructuredData(input: {
  locale: SiteLocale;
  jobTitle: string;
  description: string;
}): Thing {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Julia Komarova",
    url: buildAbsoluteUrl(`/${input.locale}`),
    jobTitle: input.jobTitle,
    description: input.description,
  };
}

export function buildWebsiteStructuredData(locale: SiteLocale): Thing {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Julia Komarova",
    url: buildAbsoluteUrl(`/${locale}`),
    inLanguage: locale,
  };
}

export function buildArtworkStructuredData(input: {
  locale: SiteLocale;
  slug: string;
  title: string;
  description: string;
  image?: string | null;
  year?: number | null;
  medium?: string | null;
  dimensions?: string | null;
  statusLabel?: string | null;
  statusPropertyName?: string | null;
}): Thing {
  return {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: input.title,
    url: buildAbsoluteUrl(`/${input.locale}/gallery/${input.slug}`),
    image: input.image ? buildAbsoluteUrl(input.image) : undefined,
    description: input.description,
    artMedium: input.medium ?? undefined,
    artworkSurface: input.dimensions ?? undefined,
    dateCreated: input.year ? String(input.year) : undefined,
    inLanguage: input.locale,
    creator: {
      "@type": "Person",
      name: "Julia Komarova",
    },
    additionalProperty: input.statusLabel
      ? [
          {
            "@type": "PropertyValue",
            name: input.statusPropertyName ?? "Status",
            value: input.statusLabel,
          },
        ]
      : undefined,
  };
}
