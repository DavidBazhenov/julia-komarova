import { unstable_cache } from 'next/cache';
import { prisma } from '@/server/db';
import { markDatabaseHealthy, markDatabaseUnavailable, shouldBypassDatabase } from '@/server/db/prisma';
import { CONTENT_CACHE_REVALIDATE_SECONDS, contentTags } from '@/server/revalidation/tags';
import { defaultLocale, pickLocalizedValue, type SiteLocale } from '@/shared/lib/i18n';

import type { CategoryListItem } from '../categories/types';
import { listCategories } from '../categories/service';
import { clampLimit, decodeCursor, encodeCursor } from './cursor';
import type { ArtworkDetailItem, ArtworkGalleryPage, ArtworkListItem } from './types';

export type ListArtworksInput = {
  categorySlug?: string;
  featuredOnly?: boolean;
  publishedOnly?: boolean;
  cursor?: string;
  limit?: number;
  locale?: SiteLocale;
};

type ArtworkImageRecord = {
  id: string;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
  storageKey: string;
};

type ArtworkListRecord = {
  id: string;
  slug: string;
  title: string;
  titleRu?: string | null;
  titleEn?: string | null;
  year: number | null;
  status: ArtworkListItem['status'];
  price: string | null;
  description: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  categoryIds: string[];
  relatedArtworkIds: string[];
  coverImage: ArtworkImageRecord | null;
  images: ArtworkImageRecord[];
};

type ArtworkDetailRecord = ArtworkListRecord & {
  medium: string | null;
  mediumRu?: string | null;
  mediumEn?: string | null;
  dimensions: string | null;
};

const getCachedArtworkListRecords = unstable_cache(
  async (
    publishedOnly: boolean,
    featuredOnly: boolean,
    limit: number,
    categoryId: string | null,
  ): Promise<ArtworkListRecord[]> =>
    prisma.artwork.findMany({
      where: {
        ...(publishedOnly ? { isPublished: true } : {}),
        ...(featuredOnly ? { isFeatured: true } : {}),
        ...(categoryId ? { categoryIds: { has: categoryId } } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }, { titleRu: 'asc' }, { title: 'asc' }],
      take: limit,
      include: {
        coverImage: {
          select: {
            id: true,
            alt: true,
            sortOrder: true,
            isPrimary: true,
            storageKey: true,
          },
        },
        images: {
          take: 1,
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            alt: true,
            sortOrder: true,
            isPrimary: true,
            storageKey: true,
          },
        },
      },
    }),
  ['public-artwork-list-records'],
  {
    tags: [contentTags.artworks],
    revalidate: CONTENT_CACHE_REVALIDATE_SECONDS,
  },
);

const getCachedArtworkRecordBySlug = unstable_cache(
  async (slug: string): Promise<ArtworkDetailRecord | null> =>
    prisma.artwork.findFirst({
      where: { slug },
      include: {
        images: {
          select: {
            id: true,
            alt: true,
            sortOrder: true,
            isPrimary: true,
            storageKey: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        coverImage: {
          select: {
            id: true,
            alt: true,
            sortOrder: true,
            isPrimary: true,
            storageKey: true,
          },
        },
      },
    }),
  ['public-artwork-record-by-slug'],
  {
    tags: [contentTags.artworks],
    revalidate: CONTENT_CACHE_REVALIDATE_SECONDS,
  },
);

function toCategorySummary(
  category: CategoryListItem | undefined,
): Pick<CategoryListItem, 'id' | 'slug' | 'title'> | null {
  if (!category) {
    return null;
  }

  return {
    id: category.id,
    slug: category.slug,
    title: category.title,
  };
}

function getVariantUrl(storageKey: string, variant: 'display' | 'thumbnail'): string {
  return `/media/${storageKey}/${variant}.webp`;
}

function mapArtworkImage(record: ArtworkImageRecord) {
  return {
    id: record.id,
    alt: record.alt ?? '',
    sortOrder: record.sortOrder,
    isPrimary: record.isPrimary,
    displayUrl: getVariantUrl(record.storageKey, 'display'),
    thumbnailUrl: getVariantUrl(record.storageKey, 'thumbnail'),
  };
}

function mapArtworkCoverImage(
  coverImage: ArtworkImageRecord | null | undefined,
  fallbackImage: ArtworkImageRecord | null | undefined,
) {
  const image = coverImage ?? fallbackImage;
  return image ? mapArtworkImage(image) : null;
}

export async function listArtworks(input: ListArtworksInput = {}): Promise<ArtworkListItem[]> {
  const limit = clampLimit(input.limit, 12, 100);
  const { locale = defaultLocale } = input;
  if (shouldBypassDatabase()) {
    return [];
  }
  try {
    const categories = await listCategories({ visibleOnly: false, locale });
    const categoryMap = new Map(categories.map((category) => [category.id, category]));
    const categoryId = input.categorySlug
      ? categories.find((category) => category.slug === input.categorySlug)?.id ?? null
      : null;

    if (input.categorySlug && !categoryId) {
      return [];
    }

    const items = await getCachedArtworkListRecords(
      input.publishedOnly ?? true,
      input.featuredOnly ?? false,
      limit,
      categoryId,
    );

    if (items.length > 0) {
      markDatabaseHealthy();
    }

    return items.map((item) => ({
      id: item.id,
      slug: item.slug,
      title:
        pickLocalizedValue(locale, {
          ru: item.titleRu,
          en: item.titleEn,
          fallback: item.title,
        }) ?? item.title,
      titleRu: item.titleRu ?? item.title,
      titleEn: item.titleEn ?? item.title,
      year: item.year,
      status: item.status,
      price: item.price,
      excerpt:
        pickLocalizedValue(locale, {
          ru: item.descriptionRu,
          en: item.descriptionEn,
          fallback: item.description,
        }) ?? undefined,
      excerptRu: item.descriptionRu ?? item.description ?? undefined,
      excerptEn: item.descriptionEn ?? item.description ?? undefined,
      coverImage: mapArtworkCoverImage(item.coverImage, item.images[0]),
      categories: item.categoryIds
        .map((resolvedCategoryId) => toCategorySummary(categoryMap.get(resolvedCategoryId)))
        .filter((category): category is Pick<CategoryListItem, 'id' | 'slug' | 'title'> => category !== null),
    }));
  } catch (error) {
    console.error('Failed to load artworks.', error);
    markDatabaseUnavailable();
    return [];
  }
}

export async function listFeaturedArtworks(
  limit = 3,
  locale: SiteLocale = defaultLocale,
): Promise<ArtworkListItem[]> {
  return listArtworks({ featuredOnly: true, limit, locale });
}

export async function listGalleryArtworks(input: ListArtworksInput = {}): Promise<ArtworkGalleryPage> {
  const limit = clampLimit(input.limit, 12, 24);
  const startIndex = decodeCursor(input.cursor);
  const locale = input.locale ?? defaultLocale;
  const items = await listArtworks({ ...input, limit: 100, locale });

  const paged = items.slice(startIndex, startIndex + limit);
  const nextOffset = startIndex + paged.length;
  const hasNextPage = nextOffset < items.length;

  return {
    items: paged,
    pageInfo: {
      nextCursor: hasNextPage ? encodeCursor(nextOffset) : null,
      hasNextPage,
      totalCount: items.length,
    },
  };
}

export async function getArtworkBySlug(
  slug: string,
  locale: SiteLocale = defaultLocale,
): Promise<ArtworkDetailItem | null> {
  if (shouldBypassDatabase()) {
    return null;
  }

  try {
    const item = await getCachedArtworkRecordBySlug(slug);

    if (item) {
      markDatabaseHealthy();
      const categories = await listCategories({ visibleOnly: false, locale });
      const categoryMap = new Map(categories.map((category) => [category.id, category]));
      const relatedWorks = item.relatedArtworkIds.length
        ? await listArtworks({ publishedOnly: false, limit: 100, locale })
        : [];

      return {
        id: item.id,
        slug: item.slug,
        title:
          pickLocalizedValue(locale, {
            ru: item.titleRu,
            en: item.titleEn,
            fallback: item.title,
          }) ?? item.title,
        titleRu: item.titleRu ?? item.title,
        titleEn: item.titleEn ?? item.title,
        year: item.year,
        status: item.status,
        price: item.price,
        excerpt:
          pickLocalizedValue(locale, {
            ru: item.descriptionRu,
            en: item.descriptionEn,
            fallback: item.description,
          }) ?? undefined,
        excerptRu: item.descriptionRu ?? item.description ?? undefined,
        excerptEn: item.descriptionEn ?? item.description ?? undefined,
        coverImage: mapArtworkCoverImage(item.coverImage, item.images[0]),
        categories: item.categoryIds
          .map((categoryId) => toCategorySummary(categoryMap.get(categoryId)))
          .filter((category): category is Pick<CategoryListItem, 'id' | 'slug' | 'title'> => category !== null),
        description:
          pickLocalizedValue(locale, {
            ru: item.descriptionRu,
            en: item.descriptionEn,
            fallback: item.description,
          }) ?? '',
        descriptionRu: item.descriptionRu ?? item.description ?? undefined,
        descriptionEn: item.descriptionEn ?? item.description ?? undefined,
        medium:
          pickLocalizedValue(locale, {
            ru: item.mediumRu,
            en: item.mediumEn,
            fallback: item.medium,
          }) ?? '',
        mediumRu: item.mediumRu ?? item.medium ?? undefined,
        mediumEn: item.mediumEn ?? item.medium ?? undefined,
        dimensions: item.dimensions ?? '',
        images: item.images.map(mapArtworkImage),
        relatedWorks: relatedWorks
          .filter((artwork) => item.relatedArtworkIds.includes(artwork.id)),
      };
    }
  } catch (error) {
    console.error(`Failed to load artwork by slug: ${slug}.`, error);
    markDatabaseUnavailable();
    throw error;
  }
  return null;
}

export async function listRelatedArtworks(
  slug: string,
  limit = 3,
  locale: SiteLocale = defaultLocale,
): Promise<ArtworkListItem[]> {
  const artwork = await getArtworkBySlug(slug, locale);
  if (!artwork) return [];

  const dbCandidates = await listArtworks({
    publishedOnly: false,
    limit: 100,
    locale,
  });
  const dbRelatedIds = new Set(artwork.relatedWorks.map((item) => item.id));
  const categorySlugs = new Set(artwork.categories.map((category) => category.slug));
  const dbMatches = dbCandidates.filter(
    (candidate) =>
      candidate.slug !== slug &&
      (dbRelatedIds.has(candidate.id) ||
        candidate.categories.some((category) => categorySlugs.has(category.slug))),
  );

  if (dbMatches.length > 0) {
    return dbMatches.slice(0, limit);
  }
  return [];
}
