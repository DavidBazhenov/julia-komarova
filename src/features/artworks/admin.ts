import { randomUUID } from 'node:crypto';

import { prisma } from '@/server/db';
import { removeArtworkImageDir, storeArtworkImageVariants } from '@/server/storage';

import type { CategoryListItem } from '../categories/types';
import type { ArtworkImageModel, ArtworkListItem, ArtworkStatus } from './types';
import {
  artworkAdminCreateInputSchema,
  artworkAdminListInputSchema,
  artworkAdminUpdateInputSchema,
  type ArtworkAdminCreateInput,
  type ArtworkAdminListInput,
  type ArtworkAdminUpdateInput,
} from './schemas';

type ArtworkImageRecord = {
  id: string;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
  url: string;
  storageKey: string;
  width: number | null;
  height: number | null;
};

function getVariantUrl(storageKey: string, variant: 'display' | 'thumbnail'): string {
  return `/media/${storageKey}/${variant}.webp`;
}

export type ArtworkAdminListItem = ArtworkListItem & {
  images: ArtworkImageModel[];
  description: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  medium: string | null;
  dimensions: string | null;
  widthCm: number | null;
  heightCm: number | null;
  depthCm: number | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  priceOnRequest: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  seoTitleRu?: string | null;
  seoTitleEn?: string | null;
  seoDescriptionRu?: string | null;
  seoDescriptionEn?: string | null;
  coverImageId: string | null;
  relatedArtworkIds: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ArtworkAdminSummary = {
  total: number;
  published: number;
  featured: number;
  available: number;
  sold: number;
  reserved: number;
  notForSale: number;
};

function mapAdminImage(record: ArtworkImageRecord): ArtworkImageModel {
  return {
    id: record.id,
    alt: record.alt ?? '',
    sortOrder: record.sortOrder,
    isPrimary: record.isPrimary,
    displayUrl: getVariantUrl(record.storageKey, 'display'),
    thumbnailUrl: getVariantUrl(record.storageKey, 'thumbnail'),
  };
}

function mapCategories(categoryRecords: {
  id: string;
  slug: string;
  title: string;
}[]): Pick<CategoryListItem, 'id' | 'slug' | 'title'>[] {
  return categoryRecords.map(({ id, slug, title }) => ({ id, slug, title }));
}

function assertUniqueIds(ids: string[], label: string): void {
  if (new Set(ids).size !== ids.length) {
    throw new Error(`${label} must not contain duplicates.`);
  }
}

async function assertArtworkSlugAvailable(slug: string, artworkId?: string): Promise<void> {
  const existing = await prisma.artwork.findFirst({
    where: {
      slug,
      ...(artworkId ? { id: { not: artworkId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error(`Artwork slug already exists: ${slug}`);
  }
}

async function assertArtworkRelationsExist(data: {
  categoryIds: string[];
  relatedArtworkIds: string[];
  coverImageId?: string | null;
}): Promise<void> {
  if (data.categoryIds.length > 0) {
    const categories = await prisma.category.findMany({
      where: { id: { in: data.categoryIds } },
      select: { id: true },
    });

    if (categories.length !== data.categoryIds.length) {
      throw new Error('One or more category IDs do not exist.');
    }
  }

  if (data.relatedArtworkIds.length > 0) {
    const relatedArtwork = await prisma.artwork.findMany({
      where: { id: { in: data.relatedArtworkIds } },
      select: { id: true },
    });

    if (relatedArtwork.length !== data.relatedArtworkIds.length) {
      throw new Error('One or more related artwork IDs do not exist.');
    }
  }

  if (data.coverImageId) {
    const coverImage = await prisma.artworkImage.findUnique({
      where: { id: data.coverImageId },
      select: { id: true },
    });

    if (!coverImage) {
      throw new Error('Cover image does not exist.');
    }
  }
}

function buildArtworkSharedData(data: ArtworkAdminCreateInput | ArtworkAdminUpdateInput) {
  return {
    slug: data.slug,
    title: data.titleRu,
    titleRu: data.titleRu,
    titleEn: data.titleEn,
    description: data.descriptionRu ?? data.descriptionEn,
    descriptionRu: data.descriptionRu,
    descriptionEn: data.descriptionEn,
    year: data.year ?? null,
    medium: data.medium,
    dimensions: data.dimensions,
    widthCm: data.widthCm ?? null,
    heightCm: data.heightCm ?? null,
    depthCm: data.depthCm ?? null,
    status: data.status,
    isFeatured: data.isFeatured,
    isPublished: data.isPublished,
    sortOrder: data.sortOrder,
    priceOnRequest: data.priceOnRequest,
    seoTitle: data.seoTitleRu ?? data.seoTitleEn,
    seoTitleRu: data.seoTitleRu,
    seoTitleEn: data.seoTitleEn,
    seoDescription: data.seoDescriptionRu ?? data.seoDescriptionEn,
    seoDescriptionRu: data.seoDescriptionRu,
    seoDescriptionEn: data.seoDescriptionEn,
    coverImageId: data.coverImageId ?? null,
    categoryIds: data.categoryIds,
    relatedArtworkIds: data.relatedArtworkIds,
  };
}

function buildCreateArtworkData(data: ArtworkAdminCreateInput) {
  return {
    ...buildArtworkSharedData(data),
    publishedAt: data.isPublished ? new Date() : null,
  };
}

function buildUpdateArtworkData(
  data: ArtworkAdminUpdateInput,
  existing: {
    coverImageId: string | null;
    publishedAt: Date | null;
  },
) {
  return {
    ...buildArtworkSharedData(data),
    coverImageId: data.coverImageId ?? existing.coverImageId,
    publishedAt: data.isPublished ? existing.publishedAt ?? new Date() : null,
  };
}

function mapArtwork(record: {
  id: string;
  slug: string;
  title: string;
  titleRu?: string | null;
  titleEn?: string | null;
  year: number | null;
  status: ArtworkStatus;
  description: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  medium: string | null;
  dimensions: string | null;
  widthCm: number | null;
  heightCm: number | null;
  depthCm: number | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  priceOnRequest: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  seoTitleRu?: string | null;
  seoTitleEn?: string | null;
  seoDescriptionRu?: string | null;
  seoDescriptionEn?: string | null;
  coverImageId: string | null;
  categoryIds: string[];
  relatedArtworkIds: string[];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  coverImage?: ArtworkImageRecord | null;
  images?: ArtworkImageRecord[];
  categories: {
    id: string;
    slug: string;
    title: string;
  }[];
}): ArtworkAdminListItem {
  const coverImage = record.coverImage ? mapAdminImage(record.coverImage) : null;

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    titleRu: record.titleRu ?? record.title,
    titleEn: record.titleEn ?? record.title,
    year: record.year,
    status: record.status,
    excerpt: record.description ?? undefined,
    excerptRu: record.descriptionRu ?? record.description ?? undefined,
    excerptEn: record.descriptionEn ?? record.description ?? undefined,
    coverImage,
    images: (record.images ?? []).map(mapAdminImage),
    categories: mapCategories(record.categories),
    description: record.description,
    descriptionRu: record.descriptionRu ?? record.description ?? undefined,
    descriptionEn: record.descriptionEn ?? record.description ?? undefined,
    medium: record.medium,
    dimensions: record.dimensions,
    widthCm: record.widthCm,
    heightCm: record.heightCm,
    depthCm: record.depthCm,
    isFeatured: record.isFeatured,
    isPublished: record.isPublished,
    sortOrder: record.sortOrder,
    priceOnRequest: record.priceOnRequest,
    seoTitle: record.seoTitle,
    seoDescription: record.seoDescription,
    coverImageId: record.coverImageId,
    relatedArtworkIds: record.relatedArtworkIds,
    publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function loadCategoriesByIds(categoryIds: string[]) {
  if (categoryIds.length === 0) return [];

  return prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, slug: true, title: true },
  });
}

export async function getArtworkAdminById(
  artworkId: string,
): Promise<ArtworkAdminListItem | null> {
  const artwork = await prisma.artwork.findUnique({
    where: { id: artworkId },
    include: {
      coverImage: {
        select: {
          id: true,
          alt: true,
          sortOrder: true,
          isPrimary: true,
          url: true,
          storageKey: true,
          width: true,
          height: true,
        },
      },
      images: {
        select: {
          id: true,
          alt: true,
          sortOrder: true,
          isPrimary: true,
          url: true,
          storageKey: true,
          width: true,
          height: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!artwork) {
    return null;
  }

  const categories = await loadCategoriesByIds(artwork.categoryIds);

  return mapArtwork({
    ...artwork,
    categories,
  });
}

export async function listAdminArtworks(
  input: ArtworkAdminListInput = {},
): Promise<ArtworkAdminListItem[]> {
  const { featuredOnly, publishedOnly, status, categoryId, limit } =
    artworkAdminListInputSchema.parse(input);

  const artworks = await prisma.artwork.findMany({
    where: {
      ...(featuredOnly ? { isFeatured: true } : {}),
      ...(publishedOnly ? { isPublished: true } : {}),
      ...(status ? { status } : {}),
      ...(categoryId ? { categoryIds: { has: categoryId } } : {}),
    },
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    take: limit,
    include: {
      coverImage: {
        select: {
          id: true,
          alt: true,
          sortOrder: true,
          isPrimary: true,
          url: true,
          storageKey: true,
          width: true,
          height: true,
        },
      },
      images: {
        select: {
          id: true,
          alt: true,
          sortOrder: true,
          isPrimary: true,
          url: true,
          storageKey: true,
          width: true,
          height: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  const categoryIds = [...new Set(artworks.flatMap((artwork) => artwork.categoryIds))];
  const categories = await loadCategoriesByIds(categoryIds);
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  return artworks.map((artwork) =>
    mapArtwork({
      ...artwork,
      categories: artwork.categoryIds
        .map((categoryId) => categoryMap.get(categoryId))
        .filter((item): item is { id: string; slug: string; title: string } => Boolean(item)),
      relatedArtworkIds: artwork.relatedArtworkIds,
    }),
  );
}

export async function createArtwork(
  input: ArtworkAdminCreateInput,
): Promise<ArtworkAdminListItem> {
  const data = artworkAdminCreateInputSchema.parse(input);
  assertUniqueIds(data.categoryIds, 'categoryIds');
  assertUniqueIds(data.relatedArtworkIds, 'relatedArtworkIds');

  await assertArtworkSlugAvailable(data.slug);
  await assertArtworkRelationsExist(data);

  const created = await prisma.artwork.create({
    data: buildCreateArtworkData(data),
    include: {
      coverImage: {
        select: {
          id: true,
          alt: true,
          sortOrder: true,
          isPrimary: true,
          url: true,
          storageKey: true,
          width: true,
          height: true,
        },
      },
      images: {
        select: {
          id: true,
          alt: true,
          sortOrder: true,
          isPrimary: true,
          url: true,
          storageKey: true,
          width: true,
          height: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  const categories = await loadCategoriesByIds(created.categoryIds);

  return mapArtwork({
    ...created,
    categories,
  });
}

export async function updateArtwork(
  input: ArtworkAdminUpdateInput,
): Promise<ArtworkAdminListItem> {
  const data = artworkAdminUpdateInputSchema.parse(input);
  assertUniqueIds(data.categoryIds, 'categoryIds');
  assertUniqueIds(data.relatedArtworkIds, 'relatedArtworkIds');

  const existing = await prisma.artwork.findUnique({
    where: { id: data.artworkId },
    select: {
      id: true,
      slug: true,
      coverImageId: true,
      publishedAt: true,
    },
  });

  if (!existing) {
    throw new Error(`Artwork does not exist: ${data.artworkId}`);
  }

  await assertArtworkSlugAvailable(data.slug, data.artworkId);
  await assertArtworkRelationsExist(data);

  const updated = await prisma.artwork.update({
    where: { id: data.artworkId },
    data: buildUpdateArtworkData(data, existing),
    include: {
      coverImage: {
        select: {
          id: true,
          alt: true,
          sortOrder: true,
          isPrimary: true,
          url: true,
          storageKey: true,
          width: true,
          height: true,
        },
      },
      images: {
        select: {
          id: true,
          alt: true,
          sortOrder: true,
          isPrimary: true,
          url: true,
          storageKey: true,
          width: true,
          height: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  const categories = await loadCategoriesByIds(updated.categoryIds);

  return mapArtwork({
    ...updated,
    categories,
  });
}

export async function uploadArtworkImage(input: {
  artworkId: string;
  alt?: string | null;
  file: Buffer;
  fileName?: string | null;
  mimeType: string;
  markAsPrimary?: boolean;
}): Promise<{ imageId: string; artworkId: string }> {
  const artwork = await prisma.artwork.findUnique({
    where: { id: input.artworkId },
    include: {
      images: {
        select: {
          id: true,
          sortOrder: true,
          isPrimary: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!artwork) {
    throw new Error(`Artwork does not exist: ${input.artworkId}`);
  }

  if (!input.mimeType.startsWith('image/')) {
    throw new Error('Only image uploads are supported.');
  }

  const storageImageId = randomUUID();
  const shouldBePrimary = input.markAsPrimary || artwork.images.length === 0;

  try {
    const stored = await storeArtworkImageVariants(input.artworkId, storageImageId, input.file, {
      fileName: input.fileName,
      mimeType: input.mimeType,
    });
    const sortOrder = (artwork.images.at(-1)?.sortOrder ?? -1) + 1;

    const created = await prisma.artworkImage.create({
      data: {
        artworkId: input.artworkId,
        storageKey: stored.storageKey,
        url: stored.displayUrl,
        width: stored.width,
        height: stored.height,
        alt: input.alt?.trim() || null,
        sortOrder,
        isPrimary: shouldBePrimary,
      },
    });

    if (shouldBePrimary) {
      await prisma.$transaction([
        prisma.artworkImage.updateMany({
          where: {
            artworkId: input.artworkId,
            id: { not: created.id },
          },
          data: { isPrimary: false },
        }),
        prisma.artwork.update({
          where: { id: input.artworkId },
          data: { coverImageId: created.id },
        }),
      ]);
    } else if (!artwork.coverImageId) {
      await prisma.artwork.update({
        where: { id: input.artworkId },
        data: { coverImageId: created.id },
      });
    }

    return {
      imageId: created.id,
      artworkId: input.artworkId,
    };
  } catch (error) {
    await removeArtworkImageDir(input.artworkId, storageImageId);
    throw error;
  }
}

async function getArtworkWithImagesForMutation(artworkId: string) {
  return prisma.artwork.findUnique({
    where: { id: artworkId },
    include: {
      images: {
        select: {
          id: true,
          artworkId: true,
          sortOrder: true,
          isPrimary: true,
          storageKey: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

export async function setPrimaryArtworkImage(input: {
  artworkId: string;
  imageId: string;
}): Promise<void> {
  const artwork = await getArtworkWithImagesForMutation(input.artworkId);
  if (!artwork) {
    throw new Error(`Artwork does not exist: ${input.artworkId}`);
  }

  const image = artwork.images.find((item) => item.id === input.imageId);
  if (!image) {
    throw new Error(`Image does not exist: ${input.imageId}`);
  }

  await prisma.$transaction([
    prisma.artworkImage.updateMany({
      where: { artworkId: input.artworkId },
      data: { isPrimary: false },
    }),
    prisma.artworkImage.update({
      where: { id: input.imageId },
      data: { isPrimary: true },
    }),
    prisma.artwork.update({
      where: { id: input.artworkId },
      data: { coverImageId: input.imageId },
    }),
  ]);
}

export async function reorderArtworkImage(input: {
  artworkId: string;
  imageId: string;
  direction: 'left' | 'right';
}): Promise<void> {
  const artwork = await getArtworkWithImagesForMutation(input.artworkId);
  if (!artwork) {
    throw new Error(`Artwork does not exist: ${input.artworkId}`);
  }

  const currentIndex = artwork.images.findIndex((item) => item.id === input.imageId);
  if (currentIndex === -1) {
    throw new Error(`Image does not exist: ${input.imageId}`);
  }

  const targetIndex = input.direction === 'left' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= artwork.images.length) {
    return;
  }

  const current = artwork.images[currentIndex];
  const target = artwork.images[targetIndex];

  await prisma.$transaction([
    prisma.artworkImage.update({
      where: { id: current.id },
      data: { sortOrder: target.sortOrder },
    }),
    prisma.artworkImage.update({
      where: { id: target.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);
}

export async function deleteArtworkImage(input: {
  artworkId: string;
  imageId: string;
}): Promise<void> {
  const artwork = await getArtworkWithImagesForMutation(input.artworkId);
  if (!artwork) {
    throw new Error(`Artwork does not exist: ${input.artworkId}`);
  }

  const image = artwork.images.find((item) => item.id === input.imageId);
  if (!image) {
    throw new Error(`Image does not exist: ${input.imageId}`);
  }

  const remainingImages = artwork.images.filter((item) => item.id !== input.imageId);
  const nextPrimary = image.isPrimary ? remainingImages[0] ?? null : null;

  await prisma.$transaction([
    prisma.artworkImage.delete({
      where: { id: input.imageId },
    }),
    prisma.artwork.update({
      where: { id: input.artworkId },
      data: {
        coverImageId:
          artwork.coverImageId === input.imageId
            ? nextPrimary?.id ?? null
            : artwork.coverImageId,
      },
    }),
    ...(nextPrimary
      ? [
          prisma.artworkImage.update({
            where: { id: nextPrimary.id },
            data: { isPrimary: true, sortOrder: 0 },
          }),
        ]
      : []),
    ...remainingImages
      .filter((item) => item.id !== nextPrimary?.id)
      .map((item, index) =>
        prisma.artworkImage.update({
          where: { id: item.id },
          data: { sortOrder: nextPrimary ? index + 1 : index },
        }),
      ),
  ]);

  const storageImageId = image.storageKey.split('/').at(-1);
  if (storageImageId) {
    await removeArtworkImageDir(input.artworkId, storageImageId);
  }
}

export async function getArtworkAdminSummary(): Promise<ArtworkAdminSummary> {
  const [total, published, featured, available, sold, reserved, notForSale] = await Promise.all([
    prisma.artwork.count(),
    prisma.artwork.count({ where: { isPublished: true } }),
    prisma.artwork.count({ where: { isFeatured: true } }),
    prisma.artwork.count({ where: { status: 'AVAILABLE' } }),
    prisma.artwork.count({ where: { status: 'SOLD' } }),
    prisma.artwork.count({ where: { status: 'RESERVED' } }),
    prisma.artwork.count({ where: { status: 'NOT_FOR_SALE' } }),
  ]);

  return {
    total,
    published,
    featured,
    available,
    sold,
    reserved,
    notForSale,
  };
}
