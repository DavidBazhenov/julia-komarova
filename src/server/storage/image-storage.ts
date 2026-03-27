import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

export type ArtworkImageVariant = 'original' | 'display' | 'thumbnail';
export type StoredArtworkImage = {
  storageKey: string;
  displayUrl: string;
  thumbnailUrl: string;
  width: number | null;
  height: number | null;
};

const STORAGE_ROOT = path.join(process.cwd(), 'storage');
const execFile = promisify(execFileCallback);
const RAW_EXTENSIONS = new Set(['.cr3', '.cr2', '.nef', '.arw', '.dng', '.raf', '.orf', '.rw2']);
const RAW_MIME_TYPES = new Set([
  'image/x-canon-cr3',
  'image/x-canon-cr2',
  'image/x-nikon-nef',
  'image/x-sony-arw',
  'image/x-adobe-dng',
  'image/x-fuji-raf',
  'image/x-olympus-orf',
  'image/x-panasonic-rw2',
  'image/x-raw',
  'application/octet-stream',
]);

type InputImageOptions = {
  fileName?: string | null;
  mimeType?: string | null;
};

export function getArtworkImageDir(artworkId: string, imageId: string): string {
  return path.join(STORAGE_ROOT, 'artworks', artworkId, imageId);
}

export function getArtworkImagePath(artworkId: string, imageId: string, variant: ArtworkImageVariant): string {
  return path.join(getArtworkImageDir(artworkId, imageId), `${variant}.webp`);
}

export function getStorageRoot(): string {
  return STORAGE_ROOT;
}

export function getArtworkImageStorageKey(artworkId: string, imageId: string): string {
  return `artworks/${artworkId}/${imageId}`;
}

export function getArtworkImagePublicUrl(
  artworkId: string,
  imageId: string,
  variant: ArtworkImageVariant,
): string {
  return `/media/artworks/${artworkId}/${imageId}/${variant}.webp`;
}

export async function ensureArtworkImageDir(artworkId: string, imageId: string): Promise<void> {
  await mkdir(getArtworkImageDir(artworkId, imageId), { recursive: true });
}

export async function removeArtworkImageDir(artworkId: string, imageId: string): Promise<void> {
  await rm(getArtworkImageDir(artworkId, imageId), { recursive: true, force: true });
}

function isRawUpload(options: InputImageOptions): boolean {
  const fileName = options.fileName?.toLowerCase() ?? '';
  const extension = path.extname(fileName);
  const mimeType = options.mimeType?.toLowerCase() ?? '';

  if (RAW_EXTENSIONS.has(extension)) {
    return true;
  }

  return RAW_MIME_TYPES.has(mimeType);
}

async function tryConvertWithSips(inputPath: string, outputPath: string): Promise<boolean> {
  try {
    await execFile('/usr/bin/sips', ['-s', 'format', 'jpeg', inputPath, '--out', outputPath]);
    return true;
  } catch {
    return false;
  }
}

async function tryConvertWithFfmpeg(inputPath: string, outputPath: string): Promise<boolean> {
  try {
    await execFile('ffmpeg', [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      inputPath,
      '-frames:v',
      '1',
      '-q:v',
      '2',
      outputPath,
    ]);
    return true;
  } catch {
    return false;
  }
}

async function normalizeInputImage(source: Buffer, options: InputImageOptions): Promise<Buffer> {
  if (!isRawUpload(options)) {
    return source;
  }

  const tempRoot = await mkdtemp(path.join(tmpdir(), 'jk-raw-upload-'));
  const extension = path.extname(options.fileName?.toLowerCase() ?? '') || '.cr3';
  const inputPath = path.join(tempRoot, `source${extension}`);
  const outputPath = path.join(tempRoot, 'converted.jpg');

  try {
    await writeFile(inputPath, source);

    const convertedWithSips = await tryConvertWithSips(inputPath, outputPath);
    const convertedWithFfmpeg = convertedWithSips ? true : await tryConvertWithFfmpeg(inputPath, outputPath);

    if (!convertedWithSips && !convertedWithFfmpeg) {
      throw new Error(
        'RAW image conversion failed. Convert the CR3 file to JPEG/PNG manually or install a RAW-capable converter on the server.',
      );
    }

    return await readFile(outputPath);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

export async function storeArtworkImageVariants(
  artworkId: string,
  imageId: string,
  source: Buffer,
  options: InputImageOptions = {},
): Promise<StoredArtworkImage> {
  await ensureArtworkImageDir(artworkId, imageId);

  const normalizedSource = await normalizeInputImage(source, options);

  const pipeline = sharp(normalizedSource, { failOn: 'none' }).rotate();
  const metadata = await pipeline.metadata();
  const width = metadata.width ?? null;
  const height = metadata.height ?? null;

  const originalBuffer = await sharp(normalizedSource, { failOn: 'none' })
    .rotate()
    .resize({
      width: 3200,
      height: 3200,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 90 })
    .toBuffer();

  const displayBuffer = await sharp(normalizedSource, { failOn: 'none' })
    .rotate()
    .resize({
      width: 1800,
      height: 1800,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 84 })
    .toBuffer();

  const thumbnailBuffer = await sharp(normalizedSource, { failOn: 'none' })
    .rotate()
    .resize({
      width: 720,
      height: 720,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 72 })
    .toBuffer();

  await Promise.all([
    writeFile(getArtworkImagePath(artworkId, imageId, 'original'), originalBuffer),
    writeFile(getArtworkImagePath(artworkId, imageId, 'display'), displayBuffer),
    writeFile(getArtworkImagePath(artworkId, imageId, 'thumbnail'), thumbnailBuffer),
  ]);

  return {
    storageKey: getArtworkImageStorageKey(artworkId, imageId),
    displayUrl: getArtworkImagePublicUrl(artworkId, imageId, 'display'),
    thumbnailUrl: getArtworkImagePublicUrl(artworkId, imageId, 'thumbnail'),
    width,
    height,
  };
}

export async function readStoredMedia(pathSegments: string[]): Promise<Buffer> {
  const safeSegments = pathSegments.filter(Boolean);
  const absolutePath = path.join(STORAGE_ROOT, ...safeSegments);
  const normalizedRoot = `${STORAGE_ROOT}${path.sep}`;
  const normalizedPath = path.normalize(absolutePath);

  if (!normalizedPath.startsWith(normalizedRoot) && normalizedPath !== STORAGE_ROOT) {
    throw new Error('Invalid media path.');
  }

  return readFile(normalizedPath);
}
