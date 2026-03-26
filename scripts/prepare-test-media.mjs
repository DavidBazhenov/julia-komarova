import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const storageRoot = path.join(process.cwd(), "storage");

const mediaTargets = [
  {
    artworkId: "65f100000000000000000103",
    imageId: "65f100000000000000000203",
    sourcePath: "paintings/birmingham-museums-trust-HEEvYhNzpEo-unsplash.jpg",
  },
  {
    artworkId: "65f100000000000000000104",
    imageId: "65f100000000000000000204",
    sourcePath: "paintings/tamara-menzi-n-vnWQmmVoY-unsplash.jpg",
  },
  {
    artworkId: "65f100000000000000000105",
    imageId: "65f100000000000000000205",
    sourcePath: "paintings/birmingham-museums-trust-8wcoY3wcbL0-unsplash.jpg",
  },
  {
    artworkId: "65f100000000000000000106",
    imageId: "65f100000000000000000206",
    sourcePath: "paintings/henrik-donnestad-t2Sai-AqIpI-unsplash.jpg",
  },
];

function getImageDir(artworkId, imageId) {
  return path.join(storageRoot, "artworks", artworkId, imageId);
}

function getImagePath(artworkId, imageId, variant) {
  return path.join(getImageDir(artworkId, imageId), `${variant}.webp`);
}

async function storeVariants(artworkId, imageId, sourceBuffer) {
  await mkdir(getImageDir(artworkId, imageId), { recursive: true });

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
}

async function main() {
  for (const target of mediaTargets) {
    const sourceBuffer = await readFile(path.join(process.cwd(), target.sourcePath));
    await storeVariants(target.artworkId, target.imageId, sourceBuffer);
  }

  console.log(
    `Prepared media variants for ${mediaTargets.length} artworks under ${path.relative(process.cwd(), storageRoot)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
