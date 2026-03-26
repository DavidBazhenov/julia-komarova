import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => {
      if (value == null) return null;

      const normalized = value.trim();
      return normalized.length > 0 ? normalized : null;
    });

export const artworkStatuses = ['AVAILABLE', 'SOLD', 'RESERVED', 'NOT_FOR_SALE'] as const;

const artworkAdminMutationInputSchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(slugPattern),
  titleRu: z.string().trim().min(1).max(160),
  titleEn: z.string().trim().min(1).max(160),
  descriptionRu: optionalText(5000),
  descriptionEn: optionalText(5000),
  year: z.number().int().min(1000).max(9999).nullable().optional(),
  medium: optionalText(160),
  dimensions: optionalText(120),
  widthCm: z.number().positive().nullable().optional(),
  heightCm: z.number().positive().nullable().optional(),
  depthCm: z.number().positive().nullable().optional(),
  status: z.enum(artworkStatuses).default('AVAILABLE'),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  priceOnRequest: z.boolean().default(true),
  seoTitleRu: optionalText(160),
  seoTitleEn: optionalText(160),
  seoDescriptionRu: optionalText(320),
  seoDescriptionEn: optionalText(320),
  coverImageId: z.string().trim().min(1).nullable().optional(),
  categoryIds: z.array(z.string().trim().min(1)).default([]),
  relatedArtworkIds: z.array(z.string().trim().min(1)).default([]),
});

export const artworkAdminCreateInputSchema = artworkAdminMutationInputSchema;
export const artworkAdminUpdateInputSchema = artworkAdminMutationInputSchema.extend({
  artworkId: z.string().trim().min(1),
});

export const artworkAdminListInputSchema = z.object({
  featuredOnly: z.boolean().optional().default(false),
  publishedOnly: z.boolean().optional().default(false),
  status: z.enum(artworkStatuses).optional(),
  categoryId: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type ArtworkAdminCreateInput = z.input<typeof artworkAdminCreateInputSchema>;
export type ArtworkAdminUpdateInput = z.input<typeof artworkAdminUpdateInputSchema>;
export type ArtworkAdminListInput = z.input<typeof artworkAdminListInputSchema>;
