import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const prisma = new PrismaClient();
const rootDir = process.cwd();
const paintingsDir = path.join(rootDir, "paintings");
const storageRoot = path.join(rootDir, "storage");
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

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

  return prisma.category.create({ data });
}

async function createArtworkImage({ artworkId, alt, sourceBuffer }) {
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
    data: { coverImageId: imageRecord.id },
  });
}

function formatDimensions(width, height) {
  if (!width || !height) {
    return null;
  }

  return `${width} × ${height} px`;
}

function buildArtworkPayload({ index, categoryIds, width, height }) {
  const titleRu = `Картина ${index + 1}`;
  const titleEn = `Painting ${index + 1}`;

  return {
    slug: `kartina-${index + 1}`,
    title: titleRu,
    titleRu,
    titleEn,
    description: "Авторская работа Юлии Комаровой.",
    descriptionRu: "Авторская работа Юлии Комаровой.",
    descriptionEn: "Original artwork by Julia Komarova.",
    year: new Date().getFullYear(),
    medium: "Смешанная техника",
    mediumRu: "Смешанная техника",
    mediumEn: "Mixed media",
    dimensions: formatDimensions(width, height),
    widthCm: null,
    heightCm: null,
    depthCm: null,
    status: "AVAILABLE",
    isFeatured: index < 6,
    isPublished: true,
    sortOrder: index + 1,
    priceOnRequest: true,
    seoTitle: `${titleRu} | Юлия Комарова`,
    seoTitleRu: `${titleRu} | Юлия Комарова`,
    seoTitleEn: `${titleEn} | Julia Komarova`,
    seoDescription: "Интерьерная живопись и авторские работы Юлии Комаровой.",
    seoDescriptionRu: "Интерьерная живопись и авторские работы Юлии Комаровой.",
    seoDescriptionEn: "Interior painting and original works by Julia Komarova.",
    categoryIds,
    relatedArtworkIds: [],
    publishedAt: new Date(),
  };
}

async function loadPaintingFiles() {
  const entries = await readdir(paintingsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => allowedExtensions.has(path.extname(fileName).toLowerCase()))
    .sort((left, right) => left.localeCompare(right, "ru"));
}

async function clearExistingArtworks() {
  const artworks = await prisma.artwork.findMany({
    select: {
      id: true,
      images: {
        select: {
          id: true,
          storageKey: true,
        },
      },
    },
  });

  for (const artwork of artworks) {
    for (const image of artwork.images) {
      const storageImageId = image.storageKey.split("/").at(-1) ?? image.id;
      await removeImageDir(artwork.id, storageImageId);
    }
  }

  await prisma.inquiry.updateMany({
    where: { artworkId: { not: null } },
    data: {
      artworkId: null,
      artworkTitle: null,
    },
  });

  await prisma.artworkImage.deleteMany();
  await prisma.artwork.deleteMany();
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }

  const files = await loadPaintingFiles();
  if (files.length === 0) {
    throw new Error("No supported image files found in /paintings.");
  }

  const interior = await upsertCategory({
    slug: "interior-paintings",
    title: "Интерьерная живопись",
    titleRu: "Интерьерная живопись",
    titleEn: "Interior Paintings",
    description: "Картины, которые становятся частью пространства и задают его настроение.",
    descriptionRu: "Картины, которые становятся частью пространства и задают его настроение.",
    descriptionEn: "Paintings designed to become part of a space and set its mood.",
    sortOrder: 1,
    isVisible: true,
  });

  const series = await upsertCategory({
    slug: "author-series",
    title: "Авторские серии",
    titleRu: "Авторские серии",
    titleEn: "Author Series",
    description: "Работы, объединенные пластикой, цветом и общей интонацией.",
    descriptionRu: "Работы, объединенные пластикой, цветом и общей интонацией.",
    descriptionEn: "Works united by rhythm, color, and a shared visual direction.",
    sortOrder: 2,
    isVisible: true,
  });

  const commissions = await upsertCategory({
    slug: "commissioned-works",
    title: "Работы на заказ",
    titleRu: "Работы на заказ",
    titleEn: "Commissioned Works",
    description: "Картины, адаптируемые под конкретное пространство и задачу.",
    descriptionRu: "Картины, адаптируемые под конкретное пространство и задачу.",
    descriptionEn: "Works that can be adapted to a particular interior and request.",
    sortOrder: 3,
    isVisible: true,
  });

  await clearExistingArtworks();

  const categoryCycle = [
    [interior.id, series.id],
    [interior.id, commissions.id],
    [series.id],
    [commissions.id],
  ];

  const createdArtworks = [];

  for (const [index, fileName] of files.entries()) {
    const absolutePath = path.join(paintingsDir, fileName);
    const sourceBuffer = await readFile(absolutePath);
    const metadata = await sharp(sourceBuffer, { failOn: "none" }).rotate().metadata();
    const categoryIds = categoryCycle[index % categoryCycle.length];

    const artwork = await prisma.artwork.create({
      data: buildArtworkPayload({
        index,
        categoryIds,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
      }),
      select: { id: true, slug: true, titleRu: true },
    });

    await createArtworkImage({
      artworkId: artwork.id,
      alt: artwork.titleRu ?? `Картина ${index + 1}`,
      sourceBuffer,
    });

    createdArtworks.push(artwork);
  }

  for (const [index, artwork] of createdArtworks.entries()) {
    const relatedIds = [
      createdArtworks[index - 1]?.id,
      createdArtworks[index + 1]?.id,
      createdArtworks[index + 2]?.id,
    ].filter(Boolean);

    await prisma.artwork.update({
      where: { id: artwork.id },
      data: { relatedArtworkIds: relatedIds },
    });
  }

  console.log(`Imported ${createdArtworks.length} artworks from /paintings`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
