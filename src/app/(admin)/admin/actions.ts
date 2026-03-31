"use server";

import path from "node:path";
import { redirect } from "next/navigation";

import {
  createArtwork,
  createCategory,
  createExhibitionCategory,
  deleteArtwork,
  deleteCategory,
  deleteExhibitionCategory,
  createExhibition,
  getCategoryAdminById,
  getExhibitionCategoryAdminById,
  updateInquiryStatus,
  getExhibitionAdminById,
  getArtworkAdminById,
  deleteArtworkImage,
  loginAdmin,
  logoutAdmin,
  reorderArtworkImage,
  updateCategory,
  updateExhibitionCategory,
  updateExhibition,
  updateArtwork,
  setPrimaryArtworkImage,
  uploadArtworkImage,
} from "@/features";
import { assertAdminSession } from "@/server/auth";
import {
  revalidateArtworkContent,
  revalidateCategoryContent,
  revalidateExhibitionCategoryContent,
  revalidateExhibitionContent,
  revalidatePublicExhibitions,
  revalidatePublicGallery,
  revalidatePublicHome,
  revalidatePublicArtwork,
} from "@/server/revalidation";

const SUPPORTED_ARTWORK_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const SUPPORTED_ARTWORK_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string): string | null {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

function getNumber(formData: FormData, key: string): number | undefined {
  const value = getString(formData, key);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getBoolean(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

function getStringArray(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function getReturnTo(formData: FormData, fallback: string): string {
  const value = getString(formData, "returnTo");
  return value.startsWith("/") ? value : fallback;
}

function isSupportedArtworkImageUpload(file: File): boolean {
  const normalizedMimeType = file.type.toLowerCase();
  const normalizedExtension = path.extname(file.name.toLowerCase());

  if (SUPPORTED_ARTWORK_IMAGE_MIME_TYPES.has(normalizedMimeType)) {
    return true;
  }

  if (!normalizedMimeType && SUPPORTED_ARTWORK_IMAGE_EXTENSIONS.has(normalizedExtension)) {
    return true;
  }

  return false;
}

function readArtworkMutationInput(formData: FormData) {
  return {
    slug: getString(formData, "slug"),
    titleRu: getString(formData, "titleRu"),
    titleEn: getString(formData, "titleEn"),
    descriptionRu: getOptionalString(formData, "descriptionRu"),
    descriptionEn: getOptionalString(formData, "descriptionEn"),
    year: getNumber(formData, "year"),
    mediumRu: getOptionalString(formData, "mediumRu"),
    mediumEn: getOptionalString(formData, "mediumEn"),
    dimensions: getOptionalString(formData, "dimensions"),
    widthCm: getNumber(formData, "widthCm"),
    heightCm: getNumber(formData, "heightCm"),
    depthCm: getNumber(formData, "depthCm"),
    status: getString(formData, "status") as
      | "AVAILABLE"
      | "SOLD"
      | "RESERVED"
      | "NOT_FOR_SALE",
    isFeatured: getBoolean(formData, "isFeatured"),
    isPublished: getBoolean(formData, "isPublished"),
    sortOrder: getNumber(formData, "sortOrder") ?? 0,
    price: getOptionalString(formData, "price"),
    seoTitleRu: getOptionalString(formData, "seoTitleRu"),
    seoTitleEn: getOptionalString(formData, "seoTitleEn"),
    seoDescriptionRu: getOptionalString(formData, "seoDescriptionRu"),
    seoDescriptionEn: getOptionalString(formData, "seoDescriptionEn"),
    coverImageId: getOptionalString(formData, "coverImageId"),
    categoryIds: getStringArray(formData, "categoryIds"),
    relatedArtworkIds: getStringArray(formData, "relatedArtworkIds"),
  };
}

export async function loginAdminAction(formData: FormData): Promise<void> {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const next = getString(formData, "next") || "/admin";

  try {
    await loginAdmin({ email, password });
  } catch {
    redirect(`/admin/login?error=invalid&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function logoutAdminAction(): Promise<void> {
  await logoutAdmin();
  redirect("/admin/login?logged_out=1");
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  await assertAdminSession();

  try {
    await createCategory({
      slug: getString(formData, "slug"),
      titleRu: getString(formData, "titleRu"),
      titleEn: getString(formData, "titleEn"),
      descriptionRu: getOptionalString(formData, "descriptionRu"),
      descriptionEn: getOptionalString(formData, "descriptionEn"),
      sortOrder: getNumber(formData, "sortOrder") ?? 0,
      isVisible: getBoolean(formData, "isVisible"),
    });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`/admin/categories?error=${message}`);
  }

  revalidatePublicHome();
  revalidatePublicGallery();
  revalidateCategoryContent();
  redirect("/admin/categories?created=1");
}

export async function updateCategoryAction(formData: FormData): Promise<void> {
  await assertAdminSession();

  const categoryId = getString(formData, "categoryId");
  const returnTo = getReturnTo(formData, `/admin/categories/${categoryId}`);

  try {
    const current = await getCategoryAdminById(categoryId);
    if (!current) {
      throw new Error(`Category does not exist: ${categoryId}`);
    }

    await updateCategory({
      categoryId,
      slug: getString(formData, "slug"),
      titleRu: getString(formData, "titleRu"),
      titleEn: getString(formData, "titleEn"),
      descriptionRu: getOptionalString(formData, "descriptionRu"),
      descriptionEn: getOptionalString(formData, "descriptionEn"),
      sortOrder: getNumber(formData, "sortOrder") ?? 0,
      isVisible: getBoolean(formData, "isVisible"),
    });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`${returnTo}?error=${message}`);
  }

  revalidatePublicHome();
  revalidatePublicGallery();
  revalidateCategoryContent();
  redirect(`${returnTo}?updated=1`);
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await assertAdminSession();

  const categoryId = getString(formData, "categoryId");
  const returnTo = getReturnTo(formData, "/admin/categories");

  try {
    await deleteCategory(categoryId);
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`${returnTo}?error=${message}`);
  }

  revalidatePublicHome();
  revalidatePublicGallery();
  revalidateCategoryContent();
  redirect("/admin/categories?updated=1");
}

export async function createExhibitionCategoryAction(formData: FormData): Promise<void> {
  await assertAdminSession();

  try {
    await createExhibitionCategory({
      slug: getString(formData, "slug"),
      titleRu: getString(formData, "titleRu"),
      titleEn: getString(formData, "titleEn"),
      descriptionRu: getOptionalString(formData, "descriptionRu"),
      descriptionEn: getOptionalString(formData, "descriptionEn"),
      sortOrder: getNumber(formData, "sortOrder") ?? 0,
      isVisible: getBoolean(formData, "isVisible"),
    });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`/admin/exhibition-categories?error=${message}`);
  }

  revalidateExhibitionCategoryContent();
  revalidateExhibitionContent();
  revalidatePublicExhibitions();
  redirect("/admin/exhibition-categories?created=1");
}

export async function updateExhibitionCategoryAction(formData: FormData): Promise<void> {
  await assertAdminSession();

  const categoryId = getString(formData, "categoryId");
  const returnTo = getReturnTo(formData, `/admin/exhibition-categories/${categoryId}`);

  try {
    const current = await getExhibitionCategoryAdminById(categoryId);
    if (!current) {
      throw new Error(`Exhibition category does not exist: ${categoryId}`);
    }

    await updateExhibitionCategory({
      categoryId,
      slug: getString(formData, "slug"),
      titleRu: getString(formData, "titleRu"),
      titleEn: getString(formData, "titleEn"),
      descriptionRu: getOptionalString(formData, "descriptionRu"),
      descriptionEn: getOptionalString(formData, "descriptionEn"),
      sortOrder: getNumber(formData, "sortOrder") ?? 0,
      isVisible: getBoolean(formData, "isVisible"),
    });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`${returnTo}?error=${message}`);
  }

  revalidateExhibitionCategoryContent();
  revalidateExhibitionContent();
  revalidatePublicExhibitions();
  redirect(`${returnTo}?updated=1`);
}

export async function deleteExhibitionCategoryAction(formData: FormData): Promise<void> {
  await assertAdminSession();

  const categoryId = getString(formData, "categoryId");
  const returnTo = getReturnTo(formData, "/admin/exhibition-categories");

  try {
    await deleteExhibitionCategory(categoryId);
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`${returnTo}?error=${message}`);
  }

  revalidateExhibitionCategoryContent();
  revalidateExhibitionContent();
  revalidatePublicExhibitions();
  redirect("/admin/exhibition-categories?updated=1");
}

export async function createExhibitionAction(formData: FormData): Promise<void> {
  await assertAdminSession();

  try {
    await createExhibition({
      slug: getString(formData, "slug"),
      section: getString(formData, "section") as "SOLO" | "GROUP" | "PRESS",
      categoryId: getOptionalString(formData, "categoryId"),
      titleRu: getString(formData, "titleRu"),
      titleEn: getString(formData, "titleEn"),
      venue: getString(formData, "venue"),
      city: getOptionalString(formData, "city"),
      country: getOptionalString(formData, "country"),
      startDate: new Date(getString(formData, "startDate")),
      endDate: getOptionalString(formData, "endDate")
        ? new Date(getString(formData, "endDate"))
        : null,
      sourceUrl: getOptionalString(formData, "sourceUrl"),
      descriptionRu: getOptionalString(formData, "descriptionRu"),
      descriptionEn: getOptionalString(formData, "descriptionEn"),
      posterImageUrl: getOptionalString(formData, "posterImageUrl"),
      seoTitleRu: getOptionalString(formData, "seoTitleRu"),
      seoTitleEn: getOptionalString(formData, "seoTitleEn"),
      seoDescriptionRu: getOptionalString(formData, "seoDescriptionRu"),
      seoDescriptionEn: getOptionalString(formData, "seoDescriptionEn"),
      isPublished: getBoolean(formData, "isPublished"),
      sortOrder: getNumber(formData, "sortOrder") ?? 0,
    });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`/admin/exhibitions?error=${message}`);
  }

  revalidateExhibitionContent();
  revalidatePublicHome();
  revalidatePublicExhibitions();
  redirect("/admin/exhibitions?created=1");
}

export async function updateExhibitionAction(formData: FormData): Promise<void> {
  await assertAdminSession();

  const exhibitionId = getString(formData, "exhibitionId");
  const returnTo = getReturnTo(formData, `/admin/exhibitions/${exhibitionId}`);

  try {
    const current = await getExhibitionAdminById(exhibitionId);
    if (!current) {
      throw new Error(`Exhibition does not exist: ${exhibitionId}`);
    }

    await updateExhibition({
      exhibitionId,
      slug: getString(formData, "slug"),
      section: getString(formData, "section") as "SOLO" | "GROUP" | "PRESS",
      categoryId: getOptionalString(formData, "categoryId"),
      titleRu: getString(formData, "titleRu"),
      titleEn: getString(formData, "titleEn"),
      venue: getString(formData, "venue"),
      city: getOptionalString(formData, "city"),
      country: getOptionalString(formData, "country"),
      startDate: new Date(getString(formData, "startDate")),
      endDate: getOptionalString(formData, "endDate")
        ? new Date(getString(formData, "endDate"))
        : null,
      sourceUrl: getOptionalString(formData, "sourceUrl"),
      descriptionRu: getOptionalString(formData, "descriptionRu"),
      descriptionEn: getOptionalString(formData, "descriptionEn"),
      posterImageUrl: getOptionalString(formData, "posterImageUrl"),
      seoTitleRu: getOptionalString(formData, "seoTitleRu"),
      seoTitleEn: getOptionalString(formData, "seoTitleEn"),
      seoDescriptionRu: getOptionalString(formData, "seoDescriptionRu"),
      seoDescriptionEn: getOptionalString(formData, "seoDescriptionEn"),
      isPublished: getBoolean(formData, "isPublished"),
      sortOrder: getNumber(formData, "sortOrder") ?? 0,
    });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`${returnTo}?error=${message}`);
  }

  revalidateExhibitionContent();
  revalidatePublicHome();
  revalidatePublicExhibitions();
  redirect(`${returnTo}?updated=1`);
}

export async function createArtworkAction(formData: FormData): Promise<void> {
  await assertAdminSession();
  const returnTo = getReturnTo(formData, "/admin/artworks");

  try {
    const created = await createArtwork(readArtworkMutationInput(formData));

    revalidateArtworkContent();
    revalidatePublicHome();
    revalidatePublicGallery();
    if (created.isPublished) {
      revalidatePublicArtwork(created.slug);
    }
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`${returnTo}?error=${message}`);
  }

  redirect(`${returnTo}?created=1`);
}

export async function updateArtworkAction(formData: FormData): Promise<void> {
  await assertAdminSession();

  const artworkId = getString(formData, "artworkId");
  const returnTo = getReturnTo(formData, `/admin/artworks/${artworkId}`);
  let previousSlug: string | null = null;
  let nextSlug: string | null = null;

  try {
    const current = await getArtworkAdminById(artworkId);
    if (!current) {
      throw new Error(`Artwork does not exist: ${artworkId}`);
    }
    previousSlug = current.slug;

    const updated = await updateArtwork({
      artworkId,
      ...readArtworkMutationInput(formData),
    });
    nextSlug = updated.slug;

    revalidateArtworkContent();
    revalidatePublicHome();
    revalidatePublicGallery();
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`${returnTo}?error=${message}`);
  }

  if (previousSlug) {
    revalidatePublicArtwork(previousSlug);
  }
  if (nextSlug && nextSlug !== previousSlug) {
    revalidatePublicArtwork(nextSlug);
  }

  redirect(`${returnTo}?updated=1`);
}

export async function deleteArtworkAction(formData: FormData): Promise<void> {
  await assertAdminSession();

  const artworkId = getString(formData, "artworkId");
  const returnTo = getReturnTo(formData, "/admin/artworks");
  let deletedSlug: string | null = null;

  try {
    const deleted = await deleteArtwork(artworkId);
    deletedSlug = deleted.slug;

    revalidateArtworkContent();
    revalidatePublicHome();
    revalidatePublicGallery();
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`${returnTo}?error=${message}`);
  }

  if (deletedSlug) {
    revalidatePublicArtwork(deletedSlug);
  }

  redirect("/admin/artworks?deleted=1");
}

export async function uploadArtworkImageAction(formData: FormData): Promise<void> {
  await assertAdminSession();

  const artworkId = getString(formData, "artworkId");
  const slug = getString(formData, "slug");
  const returnTo = getReturnTo(formData, "/admin/artworks");
  const alt = getOptionalString(formData, "alt");
  const markAsPrimary = getBoolean(formData, "markAsPrimary");
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    redirect(`${returnTo}?error=Image%20file%20is%20required`);
  }

  if (file.size > 25 * 1024 * 1024) {
    redirect(`${returnTo}?error=Image%20must%20be%2025MB%20or%20smaller`);
  }

  if (!isSupportedArtworkImageUpload(file)) {
    redirect(`${returnTo}?error=Only%20JPG%2C%20PNG%2C%20and%20WebP%20files%20are%20supported`);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadArtworkImage({
      artworkId,
      alt,
      file: buffer,
      fileName: file.name,
      mimeType: file.type,
      markAsPrimary,
    });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`${returnTo}?error=${message}`);
  }

  revalidateArtworkContent();
  revalidatePublicHome();
  revalidatePublicGallery();
  if (slug) {
    revalidatePublicArtwork(slug);
  }

  redirect(`${returnTo}?uploaded=1`);
}

export async function setPrimaryArtworkImageAction(formData: FormData): Promise<void> {
  await assertAdminSession();

  const artworkId = getString(formData, "artworkId");
  const imageId = getString(formData, "imageId");
  const slug = getString(formData, "slug");
  const returnTo = getReturnTo(formData, "/admin/artworks");

  try {
    await setPrimaryArtworkImage({ artworkId, imageId });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`${returnTo}?error=${message}`);
  }

  revalidateArtworkContent();
  revalidatePublicHome();
  revalidatePublicGallery();
  if (slug) {
    revalidatePublicArtwork(slug);
  }

  redirect(`${returnTo}?updated=1`);
}

export async function reorderArtworkImageAction(formData: FormData): Promise<void> {
  await assertAdminSession();

  const artworkId = getString(formData, "artworkId");
  const imageId = getString(formData, "imageId");
  const slug = getString(formData, "slug");
  const direction = getString(formData, "direction");
  const returnTo = getReturnTo(formData, "/admin/artworks");

  if (direction !== "left" && direction !== "right") {
    redirect(`${returnTo}?error=Invalid%20image%20reorder%20direction`);
  }

  try {
    await reorderArtworkImage({ artworkId, imageId, direction });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`${returnTo}?error=${message}`);
  }

  revalidateArtworkContent();
  revalidatePublicGallery();
  if (slug) {
    revalidatePublicArtwork(slug);
  }

  redirect(`${returnTo}?updated=1`);
}

export async function deleteArtworkImageAction(formData: FormData): Promise<void> {
  await assertAdminSession();

  const artworkId = getString(formData, "artworkId");
  const imageId = getString(formData, "imageId");
  const slug = getString(formData, "slug");
  const returnTo = getReturnTo(formData, "/admin/artworks");

  try {
    await deleteArtworkImage({ artworkId, imageId });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`${returnTo}?error=${message}`);
  }

  revalidateArtworkContent();
  revalidatePublicHome();
  revalidatePublicGallery();
  if (slug) {
    revalidatePublicArtwork(slug);
  }

  redirect(`${returnTo}?updated=1`);
}

export async function updateInquiryStatusAction(formData: FormData): Promise<void> {
  await assertAdminSession();

  const inquiryId = getString(formData, "inquiryId");
  const status = getString(formData, "status");
  const returnTo = getReturnTo(formData, "/admin");

  if (status !== "NEW" && status !== "READ" && status !== "ARCHIVED") {
    redirect(`${returnTo}?error=Invalid%20inquiry%20status`);
  }

  try {
    await updateInquiryStatus({
      inquiryId,
      status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "unknown";
    redirect(`${returnTo}?error=${message}`);
  }

  redirect(`${returnTo}?updated=1`);
}
