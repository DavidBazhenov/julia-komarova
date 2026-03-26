import { prisma } from '@/server/db';

import type { ExhibitionListItem } from './types';
import {
  exhibitionAdminCreateInputSchema,
  exhibitionAdminListInputSchema,
  exhibitionAdminUpdateInputSchema,
  type ExhibitionAdminCreateInput,
  type ExhibitionAdminListInput,
  type ExhibitionAdminUpdateInput,
} from './schemas';

export type ExhibitionAdminListItem = ExhibitionListItem & {
  sortOrder: number;
  sourceUrl?: string | null;
  posterImageUrl: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExhibitionAdminSummary = {
  total: number;
  published: number;
  upcoming: number;
  past: number;
};

function mapExhibition(record: {
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
  startDate: Date;
  endDate: Date | null;
  sourceUrl: string | null;
  description: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  posterImageUrl: string | null;
  seoTitle: string | null;
  seoTitleRu?: string | null;
  seoTitleEn?: string | null;
  seoDescription: string | null;
  seoDescriptionRu?: string | null;
  seoDescriptionEn?: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): ExhibitionAdminListItem {
  return {
    id: record.id,
    slug: record.slug,
    section: record.section ?? 'GROUP',
    categoryId: record.categoryId ?? null,
    category: record.category
      ? {
          id: record.category.id,
          slug: record.category.slug,
          title: record.category.titleRu ?? record.category.title,
        }
      : undefined,
    title: record.title,
    titleRu: record.titleRu ?? record.title,
    titleEn: record.titleEn ?? record.title,
    venue: record.venue,
    city: record.city ?? undefined,
    country: record.country ?? undefined,
    startDate: record.startDate.toISOString(),
    endDate: record.endDate ? record.endDate.toISOString() : null,
    sourceUrl: record.sourceUrl ?? null,
    description: record.description ?? undefined,
    descriptionRu: record.descriptionRu ?? record.description ?? undefined,
    descriptionEn: record.descriptionEn ?? record.description ?? undefined,
    isPublished: record.isPublished,
    sortOrder: record.sortOrder,
    posterImageUrl: record.posterImageUrl,
    seoTitle: record.seoTitle ?? undefined,
    seoDescription: record.seoDescription ?? undefined,
    seoTitleRu: record.seoTitleRu ?? record.seoTitle ?? undefined,
    seoTitleEn: record.seoTitleEn ?? record.seoTitle ?? undefined,
    seoDescriptionRu: record.seoDescriptionRu ?? record.seoDescription ?? undefined,
    seoDescriptionEn: record.seoDescriptionEn ?? record.seoDescription ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listAdminExhibitions(
  input: ExhibitionAdminListInput = {},
): Promise<ExhibitionAdminListItem[]> {
  const { publishedOnly, upcomingOnly, limit } = exhibitionAdminListInputSchema.parse(input);
  const now = new Date();

  const items = await prisma.exhibition.findMany({
    where: {
      ...(publishedOnly ? { isPublished: true } : {}),
      ...(upcomingOnly ? { startDate: { gte: now } } : {}),
    },
    include: {
      category: true,
    },
    orderBy: [
      { sortOrder: 'asc' },
      { startDate: upcomingOnly ? 'asc' : 'desc' },
      { title: 'asc' },
    ],
    take: limit,
  });

  return items.map(mapExhibition);
}

export async function createExhibition(
  input: ExhibitionAdminCreateInput,
): Promise<ExhibitionAdminListItem> {
  const data = exhibitionAdminCreateInputSchema.parse(input);
  const existing = await prisma.exhibition.findUnique({
    where: { slug: data.slug },
  });

  if (existing) {
    throw new Error(`Exhibition slug already exists: ${data.slug}`);
  }

  const created = await prisma.exhibition.create({
    data: {
      slug: data.slug,
      section: data.section,
      categoryId: data.categoryId ?? null,
      title: data.titleRu,
      titleRu: data.titleRu,
      titleEn: data.titleEn,
      venue: data.venue,
      city: data.city,
      country: data.country,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      sourceUrl: data.sourceUrl ?? null,
      description: data.descriptionRu ?? data.descriptionEn,
      descriptionRu: data.descriptionRu,
      descriptionEn: data.descriptionEn,
      posterImageUrl: data.posterImageUrl ?? null,
      seoTitle: data.seoTitleRu ?? data.seoTitleEn,
      seoTitleRu: data.seoTitleRu,
      seoTitleEn: data.seoTitleEn,
      seoDescription: data.seoDescriptionRu ?? data.seoDescriptionEn,
      seoDescriptionRu: data.seoDescriptionRu,
      seoDescriptionEn: data.seoDescriptionEn,
      isPublished: data.isPublished,
      sortOrder: data.sortOrder,
    },
  });

  return mapExhibition(created);
}

export async function getExhibitionAdminById(
  exhibitionId: string,
): Promise<ExhibitionAdminListItem | null> {
  const item = await prisma.exhibition.findUnique({
    where: { id: exhibitionId },
    include: {
      category: true,
    },
  });

  return item ? mapExhibition(item) : null;
}

export async function updateExhibition(
  input: ExhibitionAdminUpdateInput,
): Promise<ExhibitionAdminListItem> {
  const data = exhibitionAdminUpdateInputSchema.parse(input);
  const existing = await prisma.exhibition.findFirst({
    where: {
      slug: data.slug,
      id: { not: data.exhibitionId },
    },
  });

  if (existing) {
    throw new Error(`Exhibition slug already exists: ${data.slug}`);
  }

  const updated = await prisma.exhibition.update({
    where: { id: data.exhibitionId },
    data: {
      slug: data.slug,
      section: data.section,
      categoryId: data.categoryId ?? null,
      title: data.titleRu,
      titleRu: data.titleRu,
      titleEn: data.titleEn,
      venue: data.venue,
      city: data.city,
      country: data.country,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      sourceUrl: data.sourceUrl ?? null,
      description: data.descriptionRu ?? data.descriptionEn,
      descriptionRu: data.descriptionRu,
      descriptionEn: data.descriptionEn,
      posterImageUrl: data.posterImageUrl ?? null,
      seoTitle: data.seoTitleRu ?? data.seoTitleEn,
      seoTitleRu: data.seoTitleRu,
      seoTitleEn: data.seoTitleEn,
      seoDescription: data.seoDescriptionRu ?? data.seoDescriptionEn,
      seoDescriptionRu: data.seoDescriptionRu,
      seoDescriptionEn: data.seoDescriptionEn,
      isPublished: data.isPublished,
      sortOrder: data.sortOrder,
    },
  });

  return mapExhibition(updated);
}

export async function getExhibitionAdminSummary(): Promise<ExhibitionAdminSummary> {
  const now = new Date();

  const [total, published, upcoming, past] = await Promise.all([
    prisma.exhibition.count(),
    prisma.exhibition.count({ where: { isPublished: true } }),
    prisma.exhibition.count({
      where: {
        isPublished: true,
        startDate: { gte: now },
      },
    }),
    prisma.exhibition.count({
      where: {
        isPublished: true,
        startDate: { lt: now },
      },
    }),
  ]);

  return {
    total,
    published,
    upcoming,
    past,
  };
}
