import { unstable_cache } from 'next/cache';
import { prisma } from '@/server/db';
import { markDatabaseHealthy, markDatabaseUnavailable, shouldBypassDatabase } from '@/server/db/prisma';
import { CONTENT_CACHE_REVALIDATE_SECONDS, contentTags } from '@/server/revalidation/tags';
import { defaultLocale, pickLocalizedValue, type SiteLocale } from '@/shared/lib/i18n';

import type { CategoryListItem } from './types';

export type ListCategoriesInput = {
  limit?: number;
  visibleOnly?: boolean;
  locale?: SiteLocale;
};

type CategoryRecord = {
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

const getCachedCategoryListRecords = unstable_cache(
  async (visibleOnly: boolean, limit: number | null): Promise<CategoryRecord[]> =>
    prisma.category.findMany({
      where: visibleOnly ? { isVisible: true } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { titleRu: 'asc' }, { title: 'asc' }],
      take: limit ?? undefined,
    }),
  ['public-category-list-records'],
  {
    tags: [contentTags.categories],
    revalidate: CONTENT_CACHE_REVALIDATE_SECONDS,
  },
);

const getCachedCategoryRecordBySlug = unstable_cache(
  async (slug: string): Promise<CategoryRecord | null> =>
    prisma.category.findUnique({
      where: { slug },
    }),
  ['public-category-record-by-slug'],
  {
    tags: [contentTags.categories],
    revalidate: CONTENT_CACHE_REVALIDATE_SECONDS,
  },
);

function mapCategoryRecord(
  record: CategoryRecord,
  locale: SiteLocale,
): CategoryListItem {
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

export async function listCategories(
  input: ListCategoriesInput = {},
): Promise<CategoryListItem[]> {
  const { limit, visibleOnly = true, locale = defaultLocale } = input;
  if (shouldBypassDatabase()) {
    return [];
  }
  try {
    const items = await getCachedCategoryListRecords(visibleOnly, limit ?? null);

    if (items.length > 0) {
      markDatabaseHealthy();
      return items.map((item) => mapCategoryRecord(item, locale));
    }
  } catch (error) {
    console.error('Failed to load categories.', error);
    markDatabaseUnavailable();
    return [];
  }
  return [];
}

export async function listFeaturedCategories(
  limit = 4,
  locale: SiteLocale = defaultLocale,
): Promise<CategoryListItem[]> {
  return listCategories({ limit, visibleOnly: true, locale });
}

export async function getCategoryBySlug(
  slug: string,
  locale: SiteLocale = defaultLocale,
): Promise<CategoryListItem | null> {
  if (shouldBypassDatabase()) {
    return null;
  }

  try {
    const item = await getCachedCategoryRecordBySlug(slug);

    if (item) {
      markDatabaseHealthy();
      return mapCategoryRecord(item, locale);
    }
  } catch (error) {
    console.error(`Failed to load category by slug: ${slug}.`, error);
    markDatabaseUnavailable();
    return null;
  }
  return null;
}
