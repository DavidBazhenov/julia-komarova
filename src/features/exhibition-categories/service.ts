import { prisma } from '@/server/db';
import { markDatabaseHealthy, markDatabaseUnavailable, shouldBypassDatabase } from '@/server/db/prisma';
import { defaultLocale, pickLocalizedValue, type SiteLocale } from '@/shared/lib/i18n';

import type { ExhibitionCategoryListItem } from './types';

export type ListExhibitionCategoriesInput = {
  limit?: number;
  visibleOnly?: boolean;
  locale?: SiteLocale;
};

function mapExhibitionCategoryRecord(
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
    const items = await prisma.exhibitionCategory.findMany({
      where: visibleOnly ? { isVisible: true } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { titleRu: 'asc' }, { title: 'asc' }],
      take: limit,
    });

    if (items.length > 0) {
      markDatabaseHealthy();
      return items.map((item) => mapExhibitionCategoryRecord(item, locale));
    }
  } catch {
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
    const item = await prisma.exhibitionCategory.findUnique({
      where: { slug },
    });

    if (item) {
      markDatabaseHealthy();
      return mapExhibitionCategoryRecord(item, locale);
    }
  } catch {
    markDatabaseUnavailable();
    return null;
  }

  return null;
}
