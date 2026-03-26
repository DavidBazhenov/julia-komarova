import type { Metadata } from "next";

import {
  defaultLocale,
  getAlternateLocale,
  getLocaleDisplayName,
  localizePath,
  type SiteLocale,
} from "./i18n";
import { siteConfig } from "./site";

export type PageMetadataInput = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  locale?: SiteLocale;
};

export function buildAbsoluteUrl(path = "/") {
  const base = siteConfig.url.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function createPageMetadata({
  title,
  description,
  path = "/",
  image = "/og.jpg",
  noIndex = false,
  locale = defaultLocale,
}: PageMetadataInput): Metadata {
  const localizedPath = localizePath(path, locale);
  const canonical = buildAbsoluteUrl(localizedPath);
  const imageUrl = buildAbsoluteUrl(image);
  const alternateLocale = getAlternateLocale(locale);

  return {
    title,
    description: description ?? siteConfig.description,
    alternates: {
      canonical,
      languages: {
        [locale]: canonical,
        [alternateLocale]: buildAbsoluteUrl(localizePath(path, alternateLocale)),
        "x-default": buildAbsoluteUrl(localizePath(path, defaultLocale)),
      },
    },
    openGraph: {
      title,
      description: description ?? siteConfig.description,
      url: canonical,
      siteName: siteConfig.name,
      type: "website",
      locale: getLocaleDisplayName(locale) === "RU" ? "ru_RU" : "en_US",
      alternateLocale: [
        getLocaleDisplayName(alternateLocale) === "RU" ? "ru_RU" : "en_US",
      ],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description ?? siteConfig.description,
      images: [imageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}
