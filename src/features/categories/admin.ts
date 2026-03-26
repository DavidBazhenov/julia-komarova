import { prisma } from '@/server/db';
import { defaultLocale, pickLocalizedValue, type SiteLocale } from '@/shared/lib/i18n';

import type { CategoryListItem } from './types';
import {
  categoryAdminCreateInputSchema,
  categoryAdminListInputSchema,
  categoryAdminUpdateInputSchema,
  type CategoryAdminCreateInput,
  type CategoryAdminListInput,
  type CategoryAdminUpdateInput,
} from './schemas';

export type CategoryAdminListItem = CategoryListItem & {
  createdAt: string;
  updatedAt: string;
};

export type CategoryAdminSummary = {
  total: number;
  visible: number;
  hidden: number;
};

function mapCategory(record: {
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
}, locale: SiteLocale = defaultLocale): CategoryAdminListItem {
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

export async function listAdminCategories(
  input: CategoryAdminListInput = {},
): Promise<CategoryAdminListItem[]> {
  const { visibleOnly, limit } = categoryAdminListInputSchema.parse(input);

  const items = await prisma.category.findMany({
    where: visibleOnly ? { isVisible: true } : undefined,
    orderBy: [{ sortOrder: 'asc' }, { titleRu: 'asc' }, { title: 'asc' }],
    take: limit,
  });

  return items.map((item) => mapCategory(item));
}

export async function createCategory(
  input: CategoryAdminCreateInput,
): Promise<CategoryAdminListItem> {
  const data = categoryAdminCreateInputSchema.parse(input);
  const existing = await prisma.category.findFirst({
    where: {
      slug: data.slug,
    },
  });

  if (existing) {
    throw new Error(`Category slug already exists: ${data.slug}`);
  }

  const created = await prisma.category.create({
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

  return mapCategory(created);
}

export async function getCategoryAdminById(
  categoryId: string,
): Promise<CategoryAdminListItem | null> {
  const item = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  return item ? mapCategory(item) : null;
}

export async function updateCategory(
  input: CategoryAdminUpdateInput,
): Promise<CategoryAdminListItem> {
  const data = categoryAdminUpdateInputSchema.parse(input);
  const existing = await prisma.category.findFirst({
    where: {
      slug: data.slug,
      id: { not: data.categoryId },
    },
  });

  if (existing) {
    throw new Error(`Category slug already exists: ${data.slug}`);
  }

  const updated = await prisma.category.update({
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

  return mapCategory(updated);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, slug: true },
  });

  if (!category) {
    throw new Error(`Category does not exist: ${categoryId}`);
  }

  const artworksUsingCategory = await prisma.artwork.count({
    where: {
      categoryIds: {
        has: categoryId,
      },
    },
  });

  if (artworksUsingCategory > 0) {
    throw new Error(`Category "${category.slug}" is used by ${artworksUsingCategory} artwork(s).`);
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });
}

export async function getCategoryAdminSummary(): Promise<CategoryAdminSummary> {
  const [total, visible] = await Promise.all([
    prisma.category.count(),
    prisma.category.count({ where: { isVisible: true } }),
  ]);

  return {
    total,
    visible,
    hidden: total - visible,
  };
}
