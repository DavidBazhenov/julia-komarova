import { prisma } from '@/server/db';
import { markDatabaseHealthy, markDatabaseUnavailable, shouldBypassDatabase } from '@/server/db/prisma';
import { defaultLocale, pickLocalizedValue, type SiteLocale } from '@/shared/lib/i18n';

import type { CategoryListItem } from './types';

export type ListCategoriesInput = {
  limit?: number;
  visibleOnly?: boolean;
  locale?: SiteLocale;
};

function mapCategoryRecord(
  record: {
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
  },
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
    const items = await prisma.category.findMany({
      where: visibleOnly ? { isVisible: true } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { titleRu: 'asc' }, { title: 'asc' }],
      take: limit,
    });

    if (items.length > 0) {
      markDatabaseHealthy();
      return items.map((item) => mapCategoryRecord(item, locale));
    }
  } catch {
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
    const item = await prisma.category.findUnique({
      where: { slug },
    });

    if (item) {
      markDatabaseHealthy();
      return mapCategoryRecord(item, locale);
    }
  } catch {
    markDatabaseUnavailable();
    return null;
  }
  return null;
}
