import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const prisma = new PrismaClient();
const storageRoot = path.join(process.cwd(), "storage");

function getImageDir(artworkId, imageId) {
  return path.join(storageRoot, "artworks", artworkId, imageId);
}

function getImagePath(artworkId, imageId, variant) {
  return path.join(getImageDir(artworkId, imageId), `${variant}.webp`);
}

function getStorageKey(artworkId, imageId) {
  return `artworks/${artworkId}/${imageId}`;
}

async function ensureImageDir(artworkId, imageId) {
  await mkdir(getImageDir(artworkId, imageId), { recursive: true });
}

async function removeImageDir(artworkId, imageId) {
  await rm(getImageDir(artworkId, imageId), { recursive: true, force: true });
}

async function storeVariants(artworkId, imageId, sourceBuffer) {
  await ensureImageDir(artworkId, imageId);

  const metadata = await sharp(sourceBuffer, { failOn: "none" }).rotate().metadata();
  const width = metadata.width ?? null;
  const height = metadata.height ?? null;

  const originalBuffer = await sharp(sourceBuffer, { failOn: "none" })
    .rotate()
    .resize({ width: 3200, height: 3200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer();

  const displayBuffer = await sharp(sourceBuffer, { failOn: "none" })
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer();

  const thumbnailBuffer = await sharp(sourceBuffer, { failOn: "none" })
    .rotate()
    .resize({ width: 720, height: 720, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer();

  await Promise.all([
    writeFile(getImagePath(artworkId, imageId, "original"), originalBuffer),
    writeFile(getImagePath(artworkId, imageId, "display"), displayBuffer),
    writeFile(getImagePath(artworkId, imageId, "thumbnail"), thumbnailBuffer),
  ]);

  return {
    storageKey: getStorageKey(artworkId, imageId),
    width,
    height,
  };
}

async function upsertCategory(data) {
  const existing = await prisma.category.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });

  if (existing) {
    return prisma.category.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.category.create({
    data,
  });
}

async function upsertExhibition(data) {
  const existing = await prisma.exhibition.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });

  if (existing) {
    return prisma.exhibition.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.exhibition.create({
    data,
  });
}

async function upsertArtwork(data) {
  const existing = await prisma.artwork.findUnique({
    where: { slug: data.slug },
    select: { id: true, publishedAt: true },
  });

  if (existing) {
    return prisma.artwork.update({
      where: { id: existing.id },
      data: {
        ...data,
        publishedAt: data.isPublished ? existing.publishedAt ?? new Date() : null,
      },
    });
  }

  return prisma.artwork.create({
    data: {
      ...data,
      publishedAt: data.isPublished ? new Date() : null,
    },
  });
}

async function replaceArtworkImage({ artworkId, alt, sourceBuffer }) {
  const existingImages = await prisma.artworkImage.findMany({
    where: { artworkId },
    select: { id: true },
  });

  for (const image of existingImages) {
    await removeImageDir(artworkId, image.id);
  }

  await prisma.artwork.update({
    where: { id: artworkId },
    data: { coverImageId: null },
  });

  await prisma.artworkImage.deleteMany({
    where: { artworkId },
  });

  const imageRecord = await prisma.artworkImage.create({
    data: {
      artworkId,
      storageKey: "",
      url: "",
      alt,
      sortOrder: 0,
      isPrimary: true,
    },
    select: { id: true },
  });

  const stored = await storeVariants(artworkId, imageRecord.id, sourceBuffer);

  await prisma.artworkImage.update({
    where: { id: imageRecord.id },
    data: {
      storageKey: stored.storageKey,
      url: `/media/${stored.storageKey}/display.webp`,
      width: stored.width,
      height: stored.height,
      alt,
      isPrimary: true,
      sortOrder: 0,
    },
  });

  await prisma.artwork.update({
    where: { id: artworkId },
    data: {
      coverImageId: imageRecord.id,
    },
  });
}

async function main() {
  const imagePath = process.argv[2];

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }

  if (!imagePath) {
    throw new Error("Usage: node --env-file=.env scripts/seed-test-data.mjs /absolute/path/to/image.jpg");
  }

  const sourceBuffer = await readFile(imagePath);

  const landscape = await upsertCategory({
    slug: "landscape",
    title: "Пейзажи",
    titleRu: "Пейзажи",
    titleEn: "Landscapes",
    description: "Тестовая категория для реалистичных работ.",
    descriptionRu: "Тестовая категория для реалистичных работ.",
    descriptionEn: "Test category for realistic landscape works.",
    sortOrder: 1,
    isVisible: true,
  });

  const portrait = await upsertCategory({
    slug: "portrait-studies",
    title: "Фигурные этюды",
    titleRu: "Фигурные этюды",
    titleEn: "Figure Studies",
    description: "Тестовая категория для фигурных композиций.",
    descriptionRu: "Тестовая категория для фигурных композиций.",
    descriptionEn: "Test category for figurative compositions.",
    sortOrder: 2,
    isVisible: true,
  });

  const atmospheric = await upsertCategory({
    slug: "atmospheric-series",
    title: "Атмосферическая серия",
    titleRu: "Атмосферическая серия",
    titleEn: "Atmospheric Series",
    description: "Работы о свете, тишине и дистанции.",
    descriptionRu: "Работы о свете, тишине и дистанции.",
    descriptionEn: "Works about light, stillness, and distance.",
    sortOrder: 3,
    isVisible: true,
  });

  await upsertExhibition({
    slug: "studio-preview-2026",
    title: "Студийный показ 2026",
    titleRu: "Студийный показ 2026",
    titleEn: "Studio Preview 2026",
    venue: "Julia Komarova Studio",
    city: "Moscow",
    country: "Russia",
    startDate: new Date("2026-05-20T18:00:00.000Z"),
    endDate: new Date("2026-06-10T18:00:00.000Z"),
    description: "Тестовая выставка для проверки витрины и карточек выставок.",
    descriptionRu: "Тестовая выставка для проверки витрины и карточек выставок.",
    descriptionEn: "A seeded exhibition used to validate the exhibitions section and cards.",
    seoTitle: "Студийный показ Julia Komarova",
    seoTitleRu: "Студийный показ Julia Komarova",
    seoTitleEn: "Julia Komarova Studio Preview",
    seoDescription: "Тестовая выставка в рамках seed-данных проекта.",
    seoDescriptionRu: "Тестовая выставка в рамках seed-данных проекта.",
    seoDescriptionEn: "A seeded exhibition entry for validating the website.",
    isPublished: true,
    sortOrder: 1,
  });

  const silentField = await upsertArtwork({
    slug: "silent-field",
    title: "Тихое поле",
    titleRu: "Тихое поле",
    titleEn: "Silent Field",
    description: "Тестовая работа для витрины галереи и детальной страницы.",
    descriptionRu: "Тестовая работа для витрины галереи и детальной страницы.",
    descriptionEn: "Seeded work for validating the gallery and the artwork detail page.",
    year: 2026,
    medium: "Холст, масло",
    mediumRu: "Холст, масло",
    mediumEn: "Oil on canvas",
    dimensions: "120 x 180 cm",
    widthCm: 180,
    heightCm: 120,
    depthCm: null,
    status: "AVAILABLE",
    isFeatured: true,
    isPublished: true,
    sortOrder: 1,
    seoTitle: "Тихое поле | Julia Komarova",
    seoTitleRu: "Тихое поле | Julia Komarova",
    seoTitleEn: "Silent Field | Julia Komarova",
    seoDescription: "Тестовая опубликованная работа для проверки карточек и SEO.",
    seoDescriptionRu: "Тестовая опубликованная работа для проверки карточек и SEO.",
    seoDescriptionEn: "Published seeded artwork used to validate cards and SEO metadata.",
    categoryIds: [landscape.id, atmospheric.id],
    relatedArtworkIds: [],
  });

  const greenFigure = await upsertArtwork({
    slug: "green-figure",
    title: "Зеленая фигура",
    titleRu: "Зеленая фигура",
    titleEn: "Green Figure",
    description: "Фигурная работа с темным зеленым полем и графичным ритмом ткани.",
    descriptionRu: "Фигурная работа с темным зеленым полем и графичным ритмом ткани.",
    descriptionEn: "Figurative work with a dark green field and a graphic textile rhythm.",
    year: 2025,
    medium: "Холст, масло",
    mediumRu: "Холст, масло",
    mediumEn: "Oil on canvas",
    dimensions: "150 x 100 cm",
    widthCm: 100,
    heightCm: 150,
    depthCm: null,
    status: "AVAILABLE",
    isFeatured: true,
    isPublished: true,
    sortOrder: 2,
    seoTitle: "Зеленая фигура | Julia Komarova",
    seoTitleRu: "Зеленая фигура | Julia Komarova",
    seoTitleEn: "Green Figure | Julia Komarova",
    seoDescription: "Тестовая фигурная работа с загруженным изображением.",
    seoDescriptionRu: "Тестовая фигурная работа с загруженным изображением.",
    seoDescriptionEn: "Seeded figurative artwork with an uploaded image.",
    categoryIds: [portrait.id, atmospheric.id],
    relatedArtworkIds: [silentField.id],
  });

  await prisma.artwork.update({
    where: { id: silentField.id },
    data: { relatedArtworkIds: [greenFigure.id] },
  });

  await replaceArtworkImage({
    artworkId: silentField.id,
    alt: "Тестовое изображение seeded artwork Silent Field",
    sourceBuffer,
  });

  await replaceArtworkImage({
    artworkId: greenFigure.id,
    alt: "Тестовое изображение seeded artwork Green Figure",
    sourceBuffer,
  });

  console.log("Seeded categories:", [landscape.slug, portrait.slug, atmospheric.slug].join(", "));
  console.log("Seeded exhibition:", "studio-preview-2026");
  console.log("Seeded artworks:", [silentField.slug, greenFigure.slug].join(", "));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
