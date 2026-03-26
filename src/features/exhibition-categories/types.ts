export type ExhibitionCategoryListItem = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  titleRu?: string;
  titleEn?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  sortOrder: number;
  isVisible: boolean;
};
