import { unstable_cache } from 'next/cache';
import { prisma } from '@/server/db';
import { markDatabaseHealthy, markDatabaseUnavailable, shouldBypassDatabase } from '@/server/db/prisma';
import { CONTENT_CACHE_REVALIDATE_SECONDS, contentTags } from '@/server/revalidation/tags';
import { defaultLocale, pickLocalizedValue, type SiteLocale } from '@/shared/lib/i18n';

import type { ExhibitionListItem } from './types';

export type ListExhibitionsInput = {
  limit?: number;
  publishedOnly?: boolean;
  upcomingOnly?: boolean;
  locale?: SiteLocale;
};

type ExhibitionRecord = {
  id: string;
  slug: string;
  section?: 'SOLO' | 'GROUP' | 'PRESS' | null;
  categoryId?: string | null;
  category?: {
    id: string;
    slug: string;
    title: string;
    titleRu?: string | null;
    titleEn?: string | null;
  } | null;
  title: string;
  titleRu?: string | null;
  titleEn?: string | null;
  venue: string;
  city: string | null;
  country: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  sourceUrl?: string | null;
  posterImageUrl?: string | null;
  description: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  seoTitle?: string | null;
  seoTitleRu?: string | null;
  seoTitleEn?: string | null;
  seoDescription?: string | null;
  seoDescriptionRu?: string | null;
  seoDescriptionEn?: string | null;
  isPublished: boolean;
};

const getCachedExhibitionListRecords = unstable_cache(
  async (publishedOnly: boolean, limit: number | null): Promise<ExhibitionRecord[]> =>
    prisma.exhibition.findMany({
      where: publishedOnly ? { isPublished: true } : undefined,
      include: {
        category: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { startDate: 'desc' },
        { titleRu: 'asc' },
        { title: 'asc' },
      ],
      take: limit ?? undefined,
    }),
  ['public-exhibition-list-records'],
  {
    tags: [contentTags.exhibitions],
    revalidate: CONTENT_CACHE_REVALIDATE_SECONDS,
  },
);

const getCachedExhibitionRecordBySlug = unstable_cache(
  async (slug: string): Promise<ExhibitionRecord | null> =>
    prisma.exhibition.findFirst({
      where: { slug },
      include: {
        category: true,
      },
    }),
  ['public-exhibition-record-by-slug'],
  {
    tags: [contentTags.exhibitions],
    revalidate: CONTENT_CACHE_REVALIDATE_SECONDS,
  },
);

function toIsoDateString(value: Date | string): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function mapExhibitionRecord(
  record: ExhibitionRecord,
  locale: SiteLocale,
): ExhibitionListItem {
  return {
    id: record.id,
    slug: record.slug,
    section: record.section ?? 'GROUP',
    categoryId: record.categoryId ?? null,
    category: record.category
      ? {
          id: record.category.id,
          slug: record.category.slug,
          title:
            pickLocalizedValue(locale, {
              ru: record.category.titleRu,
              en: record.category.titleEn,
              fallback: record.category.title,
            }) ?? record.category.title,
        }
      : undefined,
    title:
      pickLocalizedValue(locale, {
        ru: record.titleRu,
        en: record.titleEn,
        fallback: record.title,
      }) ?? record.title,
    titleRu: record.titleRu ?? record.title,
    titleEn: record.titleEn ?? record.title,
    venue: record.venue,
    city: record.city ?? undefined,
    country: record.country ?? undefined,
    startDate: toIsoDateString(record.startDate),
    endDate: record.endDate ? toIsoDateString(record.endDate) : null,
    sourceUrl: record.sourceUrl ?? null,
    posterImageUrl: record.posterImageUrl ?? null,
    description:
      pickLocalizedValue(locale, {
        ru: record.descriptionRu,
        en: record.descriptionEn,
        fallback: record.description,
      }) ?? undefined,
    descriptionRu: record.descriptionRu ?? record.description ?? undefined,
    descriptionEn: record.descriptionEn ?? record.description ?? undefined,
    seoTitle:
      pickLocalizedValue(locale, {
        ru: record.seoTitleRu,
        en: record.seoTitleEn,
        fallback: record.seoTitle,
      }) ?? undefined,
    seoDescription:
      pickLocalizedValue(locale, {
        ru: record.seoDescriptionRu,
        en: record.seoDescriptionEn,
        fallback: record.seoDescription,
      }) ?? undefined,
    seoTitleRu: record.seoTitleRu ?? record.seoTitle ?? undefined,
    seoTitleEn: record.seoTitleEn ?? record.seoTitle ?? undefined,
    seoDescriptionRu: record.seoDescriptionRu ?? record.seoDescription ?? undefined,
    seoDescriptionEn: record.seoDescriptionEn ?? record.seoDescription ?? undefined,
    isPublished: record.isPublished,
  };
}

export async function listExhibitions(
  input: ListExhibitionsInput = {},
): Promise<ExhibitionListItem[]> {
  const { limit, publishedOnly = true, upcomingOnly = false, locale = defaultLocale } = input;
  const now = new Date();
  if (shouldBypassDatabase()) {
    return [];
  }
  try {
    const items = upcomingOnly
      ? await prisma.exhibition.findMany({
          where: {
            ...(publishedOnly ? { isPublished: true } : {}),
            startDate: { gte: now },
          },
          include: {
            category: true,
          },
          orderBy: [
            { sortOrder: 'asc' },
            { startDate: 'asc' },
            { titleRu: 'asc' },
            { title: 'asc' },
          ],
          take: limit,
        })
      : await getCachedExhibitionListRecords(publishedOnly, limit ?? null);

    if (items.length > 0) {
      markDatabaseHealthy();
      return items.map((item) => mapExhibitionRecord(item, locale));
    }
  } catch (error) {
    console.error('Failed to load exhibitions.', error);
    markDatabaseUnavailable();
    return [];
  }
  return [];
}

export async function listUpcomingExhibitions(
  limit = 3,
  locale: SiteLocale = defaultLocale,
): Promise<ExhibitionListItem[]> {
  return listExhibitions({ limit, upcomingOnly: true, publishedOnly: true, locale });
}

export async function getExhibitionBySlug(
  slug: string,
  locale: SiteLocale = defaultLocale,
): Promise<ExhibitionListItem | null> {
  if (shouldBypassDatabase()) {
    return null;
  }

  try {
    const item = await getCachedExhibitionRecordBySlug(slug);

    if (item) {
      markDatabaseHealthy();
      return mapExhibitionRecord(item, locale);
    }
  } catch (error) {
    console.error(`Failed to load exhibition by slug: ${slug}.`, error);
    markDatabaseUnavailable();
    throw error;
  }
  return null;
}
