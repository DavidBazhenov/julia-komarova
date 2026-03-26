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

const exhibitionCategoryAdminMutationInputSchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(slugPattern),
  titleRu: z.string().trim().min(1).max(120),
  titleEn: z.string().trim().min(1).max(120),
  descriptionRu: optionalText(500),
  descriptionEn: optionalText(500),
  sortOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
});

export const exhibitionCategoryAdminCreateInputSchema = exhibitionCategoryAdminMutationInputSchema;
export const exhibitionCategoryAdminUpdateInputSchema = exhibitionCategoryAdminMutationInputSchema.extend({
  categoryId: z.string().trim().min(1),
});

export const exhibitionCategoryAdminListInputSchema = z.object({
  visibleOnly: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(100).optional(),
});

export type ExhibitionCategoryAdminCreateInput = z.input<typeof exhibitionCategoryAdminCreateInputSchema>;
export type ExhibitionCategoryAdminUpdateInput = z.input<typeof exhibitionCategoryAdminUpdateInputSchema>;
export type ExhibitionCategoryAdminListInput = z.input<typeof exhibitionCategoryAdminListInputSchema>;
