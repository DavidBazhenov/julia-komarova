import { revalidatePath, revalidateTag } from 'next/cache';

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
