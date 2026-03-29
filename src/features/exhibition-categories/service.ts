import { unstable_cache } from 'next/cache';
import { prisma } from '@/server/db';
import { markDatabaseHealthy, markDatabaseUnavailable, shouldBypassDatabase } from '@/server/db/prisma';
import { CONTENT_CACHE_REVALIDATE_SECONDS, contentTags } from '@/server/revalidation/tags';
import { defaultLocale, pickLocalizedValue, type SiteLocale } from '@/shared/lib/i18n';

import type { ExhibitionCategoryListItem } from './types';

export type ListExhibitionCategoriesInput = {
  limit?: number;
  visibleOnly?: boolean;
  locale?: SiteLocale;
};

type ExhibitionCategoryRecord = {
  id: string;
  slug: string;
  title: string;
  titleRu?: string | null;
  titleEn?: string | null;
  description: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  sortOrder: number;
  isVisible: boolean;
};

const getCachedExhibitionCategoryListRecords = unstable_cache(
  async (visibleOnly: boolean, limit: number | null): Promise<ExhibitionCategoryRecord[]> =>
    prisma.exhibitionCategory.findMany({
      where: visibleOnly ? { isVisible: true } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { titleRu: 'asc' }, { title: 'asc' }],
      take: limit ?? undefined,
    }),
  ['public-exhibition-category-list-records'],
  {
    tags: [contentTags.exhibitionCategories],
    revalidate: CONTENT_CACHE_REVALIDATE_SECONDS,
  },
);

const getCachedExhibitionCategoryRecordBySlug = unstable_cache(
  async (slug: string): Promise<ExhibitionCategoryRecord | null> =>
    prisma.exhibitionCategory.findUnique({
      where: { slug },
    }),
  ['public-exhibition-category-record-by-slug'],
  {
    tags: [contentTags.exhibitionCategories],
    revalidate: CONTENT_CACHE_REVALIDATE_SECONDS,
  },
);

function mapExhibitionCategoryRecord(
  record: ExhibitionCategoryRecord,
  locale: SiteLocale,
): ExhibitionCategoryListItem {
  return {
    id: record.id,
    slug: record.slug,
    title:
      pickLocalizedValue(locale, {
        ru: record.titleRu,
        en: record.titleEn,
        fallback: record.title,
      }) ?? record.title,
    titleRu: record.titleRu ?? record.title,
    titleEn: record.titleEn ?? record.title,
    description:
      pickLocalizedValue(locale, {
        ru: record.descriptionRu,
        en: record.descriptionEn,
        fallback: record.description,
      }) ?? undefined,
    descriptionRu: record.descriptionRu ?? record.description ?? undefined,
    descriptionEn: record.descriptionEn ?? record.description ?? undefined,
    sortOrder: record.sortOrder,
    isVisible: record.isVisible,
  };
}

export async function listExhibitionCategories(
  input: ListExhibitionCategoriesInput = {},
): Promise<ExhibitionCategoryListItem[]> {
  const { limit, visibleOnly = true, locale = defaultLocale } = input;
  if (shouldBypassDatabase()) {
    return [];
  }

  try {
    const items = await getCachedExhibitionCategoryListRecords(visibleOnly, limit ?? null);

    if (items.length > 0) {
      markDatabaseHealthy();
      return items.map((item) => mapExhibitionCategoryRecord(item, locale));
    }
  } catch (error) {
    console.error('Failed to load exhibition categories.', error);
    markDatabaseUnavailable();
    return [];
  }

  return [];
}

export async function getExhibitionCategoryBySlug(
  slug: string,
  locale: SiteLocale = defaultLocale,
): Promise<ExhibitionCategoryListItem | null> {
  if (shouldBypassDatabase()) {
    return null;
  }

  try {
    const item = await getCachedExhibitionCategoryRecordBySlug(slug);

    if (item) {
      markDatabaseHealthy();
      return mapExhibitionCategoryRecord(item, locale);
    }
  } catch (error) {
    console.error(`Failed to load exhibition category by slug: ${slug}.`, error);
    markDatabaseUnavailable();
    return null;
  }

  return null;
}
