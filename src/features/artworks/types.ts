import type { CategoryListItem } from "../categories/types";

export type ArtworkStatus = 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'NOT_FOR_SALE';

export type ArtworkImageModel = {
  id: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
  displayUrl: string;
  thumbnailUrl: string;
};

export type ArtworkListItem = {
  id: string;
  slug: string;
  title: string;
  titleRu?: string;
  titleEn?: string;
  year: number | null;
  status: ArtworkStatus;
  price: string | null;
  excerpt?: string;
  excerptRu?: string;
  excerptEn?: string;
  coverImage?: ArtworkImageModel | null;
  categories: Pick<CategoryListItem, "id" | "slug" | "title">[];
};

export type ArtworkDetailItem = ArtworkListItem & {
  description: string;
  descriptionRu?: string;
  descriptionEn?: string;
  medium: string;
  mediumRu?: string;
  mediumEn?: string;
  dimensions: string;
  images: ArtworkImageModel[];
  relatedWorks: ArtworkListItem[];
};

export type ArtworkGalleryPage = {
  items: ArtworkListItem[];
  pageInfo: {
    nextCursor: string | null;
    hasNextPage: boolean;
    totalCount: number;
  };
};
