import { revalidatePath, revalidateTag } from 'next/cache';
import { contentTags } from './tags';

export function revalidatePublicArtwork(slug: string): void {
  revalidatePath(`/gallery/${slug}`);
  revalidatePath(`/ru/gallery/${slug}`);
  revalidatePath(`/en/gallery/${slug}`);
}

export function revalidatePublicGallery(): void {
  revalidatePath('/gallery');
  revalidatePath('/ru/gallery');
  revalidatePath('/en/gallery');
}

export function revalidatePublicHome(): void {
  revalidatePath('/');
  revalidatePath('/ru');
  revalidatePath('/en');
}

export function revalidatePublicExhibitions(): void {
  revalidatePath('/exhibitions');
  revalidatePath('/ru/exhibitions');
  revalidatePath('/en/exhibitions');
}

export function revalidateContentTag(tag: string): void {
  revalidateTag(tag);
}

export function revalidateArtworkContent(): void {
  revalidateTag(contentTags.artworks);
}

export function revalidateCategoryContent(): void {
  revalidateTag(contentTags.categories);
}

export function revalidateExhibitionContent(): void {
  revalidateTag(contentTags.exhibitions);
}

export function revalidateExhibitionCategoryContent(): void {
  revalidateTag(contentTags.exhibitionCategories);
}
