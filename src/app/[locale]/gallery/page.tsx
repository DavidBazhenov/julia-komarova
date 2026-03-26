import { getTranslations } from "next-intl/server";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import { Button, Container } from "../../../shared/ui";

import {
  createLocalizedPageMetadata,
  isLocale,
  loadLocalizedGalleryData,
  type Locale,
} from "@/app/[locale]/content";
import { GalleryInfiniteGrid } from "./GalleryInfiniteGrid";
import styles from "../../(public)/gallery/gallery.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const tGallery = await getTranslations({ locale, namespace: "Gallery" });

  return createLocalizedPageMetadata(locale, {
    title: tGallery("title"),
    description: tGallery("description"),
    path: "/gallery",
  });
}

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ category?: string | string[] }>;
}) {
  noStore();

  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const [tGallery, tArtwork, tStatuses] = await Promise.all([
    getTranslations({ locale, namespace: "Gallery" }),
    getTranslations({ locale, namespace: "Artwork" }),
    getTranslations({ locale, namespace: "Statuses" }),
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const categorySlug = Array.isArray(resolvedSearchParams?.category)
    ? resolvedSearchParams.category[0]
    : resolvedSearchParams?.category;

  const data = await loadLocalizedGalleryData(locale, categorySlug);
  const filters = [
    { label: tGallery("filterAll"), slug: null },
    ...data.categories.map((category) => ({
      label: category.title,
      slug: category.slug,
    })),
  ];

  return (
    <>
      <section className={styles.page}>
        <Container>
          <div className={styles.filterBar} aria-label="Gallery filters">
            {filters.map((filter) => (
              <Button
                key={filter.slug ?? "all"}
                href={filter.slug ? `/${locale}/gallery?category=${filter.slug}` : `/${locale}/gallery`}
                variant={
                  filter.slug === data.activeCategory || (!filter.slug && !data.activeCategory)
                    ? "primary"
                    : "secondary"
                }
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <GalleryInfiniteGrid
            key={`${locale}:${data.activeCategory ?? "all"}`}
            locale={locale}
            categorySlug={data.activeCategory}
            categoryLabels={data.categories.map(({ slug, title }) => ({ slug, title }))}
            initialItems={data.artworks}
            initialPageInfo={data.pageInfo}
            statusLabels={{
              AVAILABLE: tStatuses("AVAILABLE"),
              SOLD: tStatuses("SOLD"),
              RESERVED: tStatuses("RESERVED"),
              NOT_FOR_SALE: tStatuses("NOT_FOR_SALE"),
            }}
            copy={{
              loadingMore: tGallery("loadingMore"),
              loadMore: tGallery("loadMore"),
              end: tGallery("end"),
              error: tGallery("error"),
              retry: tGallery("retry"),
              fallbackSeries: tArtwork("fallbackTitle"),
            }}
            emptyLabel={tGallery("empty")}
          />

          <div className={styles.footerRow}>
            <Button href={`/${locale}/contacts`} variant="secondary">
              {tGallery("askButton")}
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
