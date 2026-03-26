import { readdir, stat, statfs } from "node:fs/promises";
import path from "node:path";

import { getOptionalEnv } from "@/server/config/env";

const DEFAULT_UPLOAD_QUOTA_BYTES = 20 * 1024 * 1024 * 1024;
const UNRELIABLE_FILESYSTEM_THRESHOLD_BYTES = 10 * 1024 * 1024 * 1024 * 1024;

export type StorageUsageSummary = {
  rootPath: string;
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  uploadsBytes: number;
  freePercent: number;
  usedPercent: number;
  source: "filesystem" | "quota";
};

function getStorageRoot(): string {
  const uploadDir = getOptionalEnv("UPLOAD_DIR", "storage").trim() || "storage";
  return path.resolve(process.cwd(), uploadDir);
}

async function getDirectorySize(targetPath: string): Promise<number> {
  let entries;

  try {
    entries = await readdir(targetPath, { withFileTypes: true });
  } catch {
    return 0;
  }

  const sizes = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(targetPath, entry.name);

      if (entry.isDirectory()) {
        return getDirectorySize(entryPath);
      }

      if (!entry.isFile()) {
        return 0;
      }

      try {
        const fileStat = await stat(entryPath);
        return fileStat.size;
      } catch {
        return 0;
      }
    }),
  );

  return sizes.reduce((sum, size) => sum + size, 0);
}

function parseQuotaBytes(): number | null {
  const rawBytes = getOptionalEnv("UPLOAD_STORAGE_LIMIT_BYTES").trim();
  if (rawBytes) {
    const parsed = Number(rawBytes);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  const rawGigabytes = getOptionalEnv("UPLOAD_STORAGE_LIMIT_GB").trim();
  if (rawGigabytes) {
    const parsed = Number(rawGigabytes);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed * 1024 * 1024 * 1024;
    }
  }

  return null;
}

export async function getStorageUsageSummary(): Promise<StorageUsageSummary | null> {
  const rootPath = getStorageRoot();

  try {
    const [fsStats, uploadsBytes] = await Promise.all([
      statfs(rootPath),
      getDirectorySize(rootPath),
    ]);

    const totalBytes = fsStats.bsize * fsStats.blocks;
    const freeBytes = fsStats.bsize * fsStats.bavail;
    const configuredQuotaBytes = parseQuotaBytes();
    const useQuota =
      configuredQuotaBytes != null || totalBytes >= UNRELIABLE_FILESYSTEM_THRESHOLD_BYTES;
    const effectiveTotalBytes = useQuota
      ? Math.max(configuredQuotaBytes ?? DEFAULT_UPLOAD_QUOTA_BYTES, uploadsBytes)
      : totalBytes;
    const effectiveUsedBytes = useQuota ? uploadsBytes : Math.max(totalBytes - freeBytes, 0);
    const effectiveFreeBytes = Math.max(effectiveTotalBytes - effectiveUsedBytes, 0);
    const freePercent =
      effectiveTotalBytes > 0
        ? Math.max(0, Math.min(100, (effectiveFreeBytes / effectiveTotalBytes) * 100))
        : 0;
    const usedPercent =
      effectiveTotalBytes > 0
        ? Math.max(0, Math.min(100, (effectiveUsedBytes / effectiveTotalBytes) * 100))
        : 0;

    return {
      rootPath,
      totalBytes: effectiveTotalBytes,
      freeBytes: effectiveFreeBytes,
      usedBytes: effectiveUsedBytes,
      uploadsBytes,
      freePercent,
      usedPercent,
      source: useQuota ? "quota" : "filesystem",
    };
  } catch {
    return null;
  }
}
