"use client";

import { useEffect, useRef, useState } from "react";

import type { ArtworkGalleryPage, ArtworkListItem } from "@/features/artworks/types";
import type { CategoryListItem } from "@/features/categories/types";
import { pickLocalizedValue, type SiteLocale } from "@/shared/lib/i18n";
import { ArtworkCard } from "@/shared/ui";

import styles from "../../(public)/gallery/gallery.module.css";

type GalleryCategoryLabel = Pick<CategoryListItem, "slug" | "title">;

type GalleryArtworkItem = ArtworkListItem & {
  tone: "forest" | "moss" | "dawn" | "mist";
  series: string;
};

type GalleryCopy = {
  loadingMore: string;
  loadMore: string;
  end: string;
  error: string;
  retry: string;
  fallbackSeries: string;
};

type GalleryInfiniteGridProps = {
  locale: SiteLocale;
  categorySlug: string | null;
  categoryLabels: GalleryCategoryLabel[];
  initialItems: GalleryArtworkItem[];
  initialPageInfo: ArtworkGalleryPage["pageInfo"];
  statusLabels: Record<ArtworkListItem["status"], string>;
  copy: GalleryCopy;
  emptyLabel: string;
};

const toneByCategory: Record<string, GalleryArtworkItem["tone"]> = {
  "forest-light": "forest",
  "water-and-sky": "mist",
  "meadow-paths": "dawn",
  "studio-notes": "moss",
};

function getArtworkTone(slugs: string[], fallbackSlug: string): GalleryArtworkItem["tone"] {
  const categorySlug = slugs[0];
  if (categorySlug && toneByCategory[categorySlug]) {
    return toneByCategory[categorySlug];
  }

  const hash = fallbackSlug
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const palette: GalleryArtworkItem["tone"][] = ["forest", "moss", "dawn", "mist"];
  return palette[hash % palette.length];
}

function normalizeArtwork(
  locale: SiteLocale,
  item: ArtworkListItem,
  categoryLabelBySlug: Record<string, string>,
  fallbackSeries: string,
): GalleryArtworkItem {
  const categories = item.categories.map((category) => ({
    ...category,
    title: categoryLabelBySlug[category.slug] ?? category.title,
  }));
  const title =
    pickLocalizedValue(locale, {
      ru: item.titleRu,
      en: item.titleEn,
      fallback: item.title,
    }) ?? item.title;

  return {
    ...item,
    title,
    categories,
    tone: getArtworkTone(categories.map((category) => category.slug), item.slug),
    series: categories[0]?.title ?? fallbackSeries,
  };
}

async function fetchGalleryPage(params: {
  locale: SiteLocale;
  categorySlug: string | null;
  cursor: string | null;
}): Promise<ArtworkGalleryPage> {
  const searchParams = new URLSearchParams();
  searchParams.set("locale", params.locale);
  if (params.categorySlug) {
    searchParams.set("category", params.categorySlug);
  }
  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }
  searchParams.set("limit", "12");

  const response = await fetch(`/api/gallery?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load gallery page (${response.status})`);
  }

  return (await response.json()) as ArtworkGalleryPage;
}

export function GalleryInfiniteGrid({
  locale,
  categorySlug,
  categoryLabels,
  initialItems,
  initialPageInfo,
  statusLabels,
  copy,
  emptyLabel,
}: GalleryInfiniteGridProps) {
  const categoryLabelBySlug = categoryLabels.reduce<Record<string, string>>((acc, category) => {
    acc[category.slug] = category.title;
    return acc;
  }, {});

  const [items, setItems] = useState<GalleryArtworkItem[]>(initialItems);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<(() => Promise<void>) | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  loadMoreRef.current = async () => {
    if (isLoadingMore || !pageInfo.hasNextPage || !pageInfo.nextCursor) {
      return;
    }

    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const nextPage = await fetchGalleryPage({
        locale,
        categorySlug,
        cursor: pageInfo.nextCursor,
      });

      if (!isMountedRef.current) {
        return;
      }

      const normalizedItems = nextPage.items.map((item) =>
        normalizeArtwork(locale, item, categoryLabelBySlug, copy.fallbackSeries),
      );

      setItems((current) => [...current, ...normalizedItems]);
      setPageInfo(nextPage.pageInfo);
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setLoadError(error instanceof Error ? error.message : copy.error);
    } finally {
      if (!isMountedRef.current) {
        return;
      }

      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !pageInfo.hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMoreRef.current?.();
        }
      },
      {
        rootMargin: "400px 0px",
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [pageInfo.hasNextPage]);

  const handleRetry = () => {
    void loadMoreRef.current?.();
  };

  const hasItems = items.length > 0;

  return (
    <div className={styles.gridSection}>
      {hasItems ? (
        <div className={styles.grid}>
          {items.map((work) => (
            <article key={work.id} className={styles.card}>
              <ArtworkCard
                href={`/${locale}/gallery/${work.slug}`}
                title={work.title}
                eyebrow={work.series}
                subtitle={`${work.year ?? ""}${work.status !== "AVAILABLE" ? ` · ${statusLabels[work.status]}` : ""}`.trim()}
                price={work.price ?? undefined}
                imageUrl={work.coverImage?.thumbnailUrl}
                imageAlt={work.coverImage?.alt || work.title}
                tone={work.tone}
                variant="gallery"
              />
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          {emptyLabel}
        </div>
      )}

      {isLoadingMore ? (
        <div className={styles.skeletonGrid} aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={styles.skeletonCard}>
              <div className={styles.skeletonMedia} />
              <div className={styles.skeletonMeta}>
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineWide} />
                <div className={styles.skeletonLineNarrow} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {hasItems && (loadError || isLoadingMore || pageInfo.hasNextPage) ? (
        <div className={styles.scrollStatus}>
          <p className={styles.scrollStatusText} aria-live="polite">
            {loadError
              ? `${copy.error}: ${loadError}`
              : isLoadingMore
                ? copy.loadingMore
                : copy.loadMore}
          </p>
          {pageInfo.hasNextPage ? (
            <button
              className={styles.loadMoreButton}
              type="button"
              onClick={handleRetry}
              disabled={isLoadingMore}
            >
              {loadError ? copy.retry : copy.loadMore}
            </button>
          ) : null}
        </div>
      ) : null}

      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
    </div>
  );
}
