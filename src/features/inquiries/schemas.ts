import { z } from 'zod';

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

export const inquiryStatusValues = ['NEW', 'READ', 'ARCHIVED'] as const;

export const inquiryCreateInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  contact: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(4000),
  artworkId: z.string().trim().min(1).nullable().optional(),
  source: optionalText(200),
  userAgent: optionalText(300),
  ipHash: optionalText(120),
});

export const inquiryListInputSchema = z.object({
  status: z.enum(inquiryStatusValues).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
