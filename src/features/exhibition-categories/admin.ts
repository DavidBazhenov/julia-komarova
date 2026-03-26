import { prisma } from '@/server/db';
import { defaultLocale, pickLocalizedValue, type SiteLocale } from '@/shared/lib/i18n';

import type { ExhibitionCategoryListItem } from './types';
import {
  exhibitionCategoryAdminCreateInputSchema,
  exhibitionCategoryAdminListInputSchema,
  exhibitionCategoryAdminUpdateInputSchema,
  type ExhibitionCategoryAdminCreateInput,
  type ExhibitionCategoryAdminListInput,
  type ExhibitionCategoryAdminUpdateInput,
} from './schemas';

export type ExhibitionCategoryAdminListItem = ExhibitionCategoryListItem & {
  createdAt: string;
  updatedAt: string;
};

function mapExhibitionCategory(
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
    createdAt: Date;
    updatedAt: Date;
  },
  locale: SiteLocale = defaultLocale,
): ExhibitionCategoryAdminListItem {
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
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listAdminExhibitionCategories(
  input: ExhibitionCategoryAdminListInput = {},
): Promise<ExhibitionCategoryAdminListItem[]> {
  const { visibleOnly, limit } = exhibitionCategoryAdminListInputSchema.parse(input);

  const items = await prisma.exhibitionCategory.findMany({
    where: visibleOnly ? { isVisible: true } : undefined,
    orderBy: [{ sortOrder: 'asc' }, { titleRu: 'asc' }, { title: 'asc' }],
    take: limit,
  });

  return items.map((item) => mapExhibitionCategory(item));
}

export async function createExhibitionCategory(
  input: ExhibitionCategoryAdminCreateInput,
): Promise<ExhibitionCategoryAdminListItem> {
  const data = exhibitionCategoryAdminCreateInputSchema.parse(input);
  const existing = await prisma.exhibitionCategory.findFirst({
    where: {
      slug: data.slug,
    },
  });

  if (existing) {
    throw new Error(`Exhibition category slug already exists: ${data.slug}`);
  }

  const created = await prisma.exhibitionCategory.create({
    data: {
      slug: data.slug,
      title: data.titleRu,
      titleRu: data.titleRu,
      titleEn: data.titleEn,
      description: data.descriptionRu ?? data.descriptionEn,
      descriptionRu: data.descriptionRu,
      descriptionEn: data.descriptionEn,
      sortOrder: data.sortOrder,
      isVisible: data.isVisible,
    },
  });

  return mapExhibitionCategory(created);
}

export async function getExhibitionCategoryAdminById(
  categoryId: string,
): Promise<ExhibitionCategoryAdminListItem | null> {
  const item = await prisma.exhibitionCategory.findUnique({
    where: { id: categoryId },
  });

  return item ? mapExhibitionCategory(item) : null;
}

export async function updateExhibitionCategory(
  input: ExhibitionCategoryAdminUpdateInput,
): Promise<ExhibitionCategoryAdminListItem> {
  const data = exhibitionCategoryAdminUpdateInputSchema.parse(input);
  const existing = await prisma.exhibitionCategory.findFirst({
    where: {
      slug: data.slug,
      id: { not: data.categoryId },
    },
  });

  if (existing) {
    throw new Error(`Exhibition category slug already exists: ${data.slug}`);
  }

  const updated = await prisma.exhibitionCategory.update({
    where: { id: data.categoryId },
    data: {
      slug: data.slug,
      title: data.titleRu,
      titleRu: data.titleRu,
      titleEn: data.titleEn,
      description: data.descriptionRu ?? data.descriptionEn,
      descriptionRu: data.descriptionRu,
      descriptionEn: data.descriptionEn,
      sortOrder: data.sortOrder,
      isVisible: data.isVisible,
    },
  });

  return mapExhibitionCategory(updated);
}

export async function deleteExhibitionCategory(categoryId: string): Promise<void> {
  const category = await prisma.exhibitionCategory.findUnique({
    where: { id: categoryId },
    select: { id: true, slug: true },
  });

  if (!category) {
    throw new Error(`Exhibition category does not exist: ${categoryId}`);
  }

  const exhibitionsUsingCategory = await prisma.exhibition.count({
    where: {
      categoryId,
    },
  });

  if (exhibitionsUsingCategory > 0) {
    throw new Error(`Exhibition category "${category.slug}" is used by ${exhibitionsUsingCategory} exhibition(s).`);
  }

  await prisma.exhibitionCategory.delete({
    where: { id: categoryId },
  });
}
