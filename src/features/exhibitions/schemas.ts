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

const exhibitionSectionSchema = z.enum(['SOLO', 'GROUP', 'PRESS']);

const exhibitionAdminMutationInputSchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(slugPattern),
  section: exhibitionSectionSchema,
  categoryId: z.string().trim().min(1).nullable().optional(),
  titleRu: z.string().trim().min(1).max(160),
  titleEn: z.string().trim().min(1).max(160),
  venue: z.string().trim().min(1).max(160),
  city: optionalText(120),
  country: optionalText(120),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  sourceUrl: optionalText(2048).pipe(z.string().url().nullable()),
  descriptionRu: optionalText(2000),
  descriptionEn: optionalText(2000),
  posterImageUrl: z.string().trim().url().nullable().optional(),
  seoTitleRu: optionalText(160),
  seoTitleEn: optionalText(160),
  seoDescriptionRu: optionalText(320),
  seoDescriptionEn: optionalText(320),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export const exhibitionAdminCreateInputSchema = exhibitionAdminMutationInputSchema;
export const exhibitionAdminUpdateInputSchema = exhibitionAdminMutationInputSchema.extend({
  exhibitionId: z.string().trim().min(1),
});

export const exhibitionAdminListInputSchema = z.object({
  publishedOnly: z.boolean().optional().default(false),
  upcomingOnly: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(100).optional(),
});

export type ExhibitionAdminCreateInput = z.input<typeof exhibitionAdminCreateInputSchema>;
export type ExhibitionAdminUpdateInput = z.input<typeof exhibitionAdminUpdateInputSchema>;
export type ExhibitionAdminListInput = z.input<typeof exhibitionAdminListInputSchema>;
