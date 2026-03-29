import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {
  getArtworkBySlug,
  listFeaturedArtworks,
  listGalleryArtworks,
  listRelatedArtworks
} from "../../features/artworks/service";
import type {ArtworkDetailItem, ArtworkListItem} from "../../features/artworks/types";
import {listCategories} from "../../features/categories/service";
import type {CategoryListItem} from "../../features/categories/types";
import {listExhibitionCategories} from "../../features/exhibition-categories/service";
import type {ExhibitionCategoryListItem} from "../../features/exhibition-categories/types";
import {listExhibitions} from "../../features/exhibitions/service";
import type {ExhibitionListItem} from "../../features/exhibitions/types";
import {buildAbsoluteUrl} from "@/shared/lib/metadata";
import {
  isLocale,
  locales,
  localizePath,
  stripLocalePrefix,
  type SiteLocale
} from "@/shared/lib/i18n";

type Tone = "forest" | "moss" | "dawn" | "mist";

export type Locale = SiteLocale;
export {isLocale};

export type LocalizedCategory = Pick<CategoryListItem, "id" | "slug" | "title"> & {
  description?: string;
} & Partial<Pick<CategoryListItem, "sortOrder" | "isVisible">>;

export type LocalizedArtworkListItem = ArtworkListItem & {
  tone: Tone;
  series: string;
  categories: LocalizedCategory[];
};

export type LocalizedArtworkDetailItem = ArtworkDetailItem & {
  tone: Tone;
  series: string;
  categories: LocalizedCategory[];
  relatedWorks: LocalizedArtworkListItem[];
};

export type LocalizedArtworkPageData = {
  artwork: LocalizedArtworkDetailItem;
  relatedWorks: LocalizedArtworkListItem[];
};

export type LocalizedExhibitionItem = ExhibitionListItem & {
  label: string;
};

export type LocalizedExhibitionCategory = ExhibitionCategoryListItem & {
  exhibitions: LocalizedExhibitionItem[];
};

export type HomePageData = {
  featuredArtworks: LocalizedArtworkListItem[];
  exhibitions: LocalizedExhibitionItem[];
};

export type GalleryPageData = {
  artworks: LocalizedArtworkListItem[];
  categories: LocalizedCategory[];
  activeCategory: string | null;
  pageInfo: {
    nextCursor: string | null;
    hasNextPage: boolean;
    totalCount: number;
  };
};

const toneByCategory: Record<string, Tone> = {
  "forest-light": "forest",
  "water-and-sky": "mist",
  "meadow-paths": "dawn",
  "studio-notes": "moss"
};

export function getStaticLocaleParams(): Array<{locale: Locale}> {
  return locales.map((locale) => ({locale}));
}

export function buildLocalePath(locale: Locale, pathname = "/"): string {
  return localizePath(pathname, locale);
}

export function buildLocaleLanguagePath(targetLocale: Locale, pathname: string): string {
  const [rawPathname, rawSearch = ""] = pathname.split("?");
  const {path} = stripLocalePrefix(rawPathname);
  const localized = buildLocalePath(targetLocale, path);
  return rawSearch ? `${localized}?${rawSearch}` : localized;
}

function getArtworkTone(artwork: Pick<ArtworkListItem, "slug" | "categories">): Tone {
  const categorySlug = artwork.categories[0]?.slug;
  if (categorySlug && toneByCategory[categorySlug]) {
    return toneByCategory[categorySlug];
  }

  const hash = artwork.slug
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const palette: Tone[] = ["forest", "moss", "dawn", "mist"];
  return palette[hash % palette.length];
}

function localizeCategory(
  category: Pick<CategoryListItem, "id" | "slug" | "title"> & Partial<CategoryListItem>
): LocalizedCategory {
  return {
    ...category,
    description: category.description
  };
}

function localizeArtworkListItem(
  fallbackTitle: string,
  item: ArtworkListItem
): LocalizedArtworkListItem {
  const categories = item.categories.map((category) => localizeCategory(category));
  const firstCategory = categories[0];
  const series = firstCategory?.title ?? fallbackTitle;

  return {
    ...item,
    categories,
    tone: getArtworkTone(item),
    series
  };
}

function localizeArtworkDetailItem(
  fallbackTitle: string,
  item: ArtworkDetailItem
): LocalizedArtworkDetailItem {
  return {
    ...localizeArtworkListItem(fallbackTitle, item),
    description: item.description,
    medium: item.medium,
    dimensions: item.dimensions,
    images: item.images,
    relatedWorks: item.relatedWorks.map((work) => localizeArtworkListItem(fallbackTitle, work))
  };
}

function localizeExhibitionItem(
  fallbackLabel: string,
  item: ExhibitionListItem
): LocalizedExhibitionItem {
  return {
    ...item,
    label: fallbackLabel
  };
}

export function createLocalizedPageMetadata(
  locale: Locale,
  {
    title,
    description,
    path = "/",
    image = "/og.jpg",
    noIndex = false
  }: {
    title: string;
    description?: string;
    path?: string;
    image?: string;
    noIndex?: boolean;
  }
): Metadata {
  const localizedPath = buildLocalePath(locale, path);
  const imageUrl = image.startsWith("http") ? image : buildAbsoluteUrl(image);

  return {
    title,
    description,
    alternates: {
      canonical: localizedPath,
      languages: {
        en: buildLocalePath("en", path),
        ru: buildLocalePath("ru", path),
        "x-default": buildLocalePath("ru", path)
      }
    },
    openGraph: {
      title,
      description,
      url: localizedPath,
      siteName: "Julia Komarova",
      type: "website",
      locale: locale === "ru" ? "ru_RU" : "en_US",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl]
    },
    robots: noIndex
      ? {index: false, follow: false}
      : {index: true, follow: true}
  };
}

function buildExhibitionFallbackLabel(item: ExhibitionListItem): string {
  return [item.city, item.country].filter(Boolean).join(", ");
}

async function resolveExhibitionLabel(locale: Locale, item: ExhibitionListItem): Promise<string> {
  const tLabels = await getTranslations({locale, namespace: "ExhibitionLabels"});

  try {
    return tLabels(item.slug as never);
  } catch {
    return buildExhibitionFallbackLabel(item);
  }
}

export async function loadLocalizedHomeData(locale: Locale): Promise<HomePageData> {
  const tArtwork = await getTranslations({locale, namespace: "Artwork"});
  const [featuredArtworks, exhibitions] = await Promise.all([
    listFeaturedArtworks(12, locale),
    listExhibitions({limit: 6, publishedOnly: true, locale})
  ]);

  const localizedExhibitions = await Promise.all(
    exhibitions.map(async (item) =>
      localizeExhibitionItem(await resolveExhibitionLabel(locale, item), item)
    )
  );

  return {
    featuredArtworks: featuredArtworks.map((item) => localizeArtworkListItem(tArtwork("fallbackTitle"), item)),
    exhibitions: localizedExhibitions
  };
}

export async function loadLocalizedGalleryData(
  locale: Locale,
  categorySlug?: string
): Promise<GalleryPageData> {
  const tArtwork = await getTranslations({locale, namespace: "Artwork"});
  const [galleryPage, categories] = await Promise.all([
    listGalleryArtworks({categorySlug, limit: 24, locale}),
    listCategories({visibleOnly: true, locale})
  ]);

  return {
    artworks: galleryPage.items.map((item) => localizeArtworkListItem(tArtwork("fallbackTitle"), item)),
    categories: categories.map((category) => localizeCategory(category)),
    activeCategory: categorySlug ?? null,
    pageInfo: galleryPage.pageInfo
  };
}

export async function loadLocalizedGalleryPage(
  locale: Locale,
  {
    categorySlug,
    cursor,
    limit
  }: {
    categorySlug?: string;
    cursor?: string;
    limit?: number;
  } = {}
): Promise<Pick<GalleryPageData, "artworks" | "pageInfo">> {
  const tArtwork = await getTranslations({locale, namespace: "Artwork"});
  const galleryPage = await listGalleryArtworks({
    categorySlug,
    cursor,
    limit,
    locale
  });

  return {
    artworks: galleryPage.items.map((item) => localizeArtworkListItem(tArtwork("fallbackTitle"), item)),
    pageInfo: galleryPage.pageInfo
  };
}

export async function loadLocalizedArtworkData(
  locale: Locale,
  slug: string
): Promise<LocalizedArtworkPageData | null> {
  const tArtwork = await getTranslations({locale, namespace: "Artwork"});
  const artwork = await getArtworkBySlug(slug, locale);
  if (!artwork) {
    return null;
  }

  const relatedWorks = await listRelatedArtworks(slug, 12, locale);
  const localizedArtwork = localizeArtworkDetailItem(tArtwork("fallbackTitle"), {
    ...artwork,
    relatedWorks: relatedWorks.length > 0 ? relatedWorks : artwork.relatedWorks
  });

  return {
    artwork: localizedArtwork,
    relatedWorks: localizedArtwork.relatedWorks
  };
}

export async function loadLocalizedExhibitionsData(locale: Locale): Promise<LocalizedExhibitionItem[]> {
  const exhibitions = await listExhibitions({publishedOnly: true, locale});
  return Promise.all(
    exhibitions.map(async (item) =>
      localizeExhibitionItem(await resolveExhibitionLabel(locale, item), item)
    )
  );
}

export async function loadLocalizedExhibitionsByCategory(
  locale: Locale,
): Promise<LocalizedExhibitionCategory[]> {
  const [categories, exhibitions] = await Promise.all([
    listExhibitionCategories({ visibleOnly: true, locale }),
    loadLocalizedExhibitionsData(locale),
  ]);

  return categories.map((category) => ({
    ...category,
    exhibitions: exhibitions.filter((item) => item.categoryId === category.id),
  }));
}

export async function getArtworkFallbackLocalizedTitle(locale: Locale, slug: string): Promise<string> {
  const tArtwork = await getTranslations({locale, namespace: "Artwork"});
  const artwork = await getArtworkBySlug(slug, locale);
  return artwork?.title ?? tArtwork("fallbackTitle");
}
