import { Button, Container } from "../../../../shared/ui";
import { ArtworkCarousel } from "../../../../shared/ui/artwork-carousel";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  createLocalizedPageMetadata,
  isLocale,
  loadLocalizedArtworkData,
  type Locale,
} from "@/app/[locale]/content";
import { buildArtworkStructuredData } from "@/shared/lib/structured-data";
import styles from "../../../(public)/gallery/[slug]/artwork.module.css";
import { ArtworkInlineSlider } from "./ArtworkInlineSlider";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const [tArtwork, tGallery] = await Promise.all([
    getTranslations({ locale, namespace: "Artwork" }),
    getTranslations({ locale, namespace: "Gallery" }),
  ]);
  const data = await loadLocalizedArtworkData(locale, slug);

  return createLocalizedPageMetadata(locale, {
    title: data?.artwork.title ?? tArtwork("fallbackTitle"),
    path: `/gallery/${slug}`,
    description: data?.artwork.description ?? tGallery("description"),
    image: data?.artwork.coverImage?.displayUrl ?? "/og.jpg",
  });
}

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const [tArtwork, tStatuses] = await Promise.all([
    getTranslations({ locale, namespace: "Artwork" }),
    getTranslations({ locale, namespace: "Statuses" }),
  ]);
  const data = await loadLocalizedArtworkData(locale, slug);

  if (!data) {
    notFound();
  }

  const { artwork, relatedWorks } = data;
  const images = artwork.images.length > 0 ? artwork.images : artwork.coverImage ? [artwork.coverImage] : [];
  const heroImage = artwork.coverImage ?? images[0] ?? null;
  const sliderImages = heroImage
    ? [heroImage, ...images.filter((image) => image.id !== heroImage.id)]
    : images;
  const structuredData = buildArtworkStructuredData({
    locale,
    slug: artwork.slug,
    title: artwork.title,
    description: artwork.description,
    image: heroImage?.displayUrl,
    year: artwork.year,
    medium: artwork.medium,
    dimensions: artwork.dimensions,
    statusLabel: tStatuses(artwork.status),
    statusPropertyName: tArtwork("labels.status"),
  });

  return (
    <section className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Container className={styles.layout}>
        <div className={styles.visual}>
          {sliderImages.length > 0 ? (
            <ArtworkInlineSlider
              title={artwork.title}
              images={sliderImages}
              labels={{
                open: tArtwork("lightbox.open"),
                close: tArtwork("lightbox.close"),
                previous: tArtwork("lightbox.previous"),
                next: tArtwork("lightbox.next"),
              }}
            />
          ) : (
            <div className={styles.frame} data-tone={artwork.tone} />
          )}
        </div>

        <div className={styles.content}>
          <p className={styles.eyebrow}>{tArtwork("eyebrow")}</p>
          <h1 className={styles.title}>{artwork.title}</h1>
          <dl className={styles.meta}>
            <div>
              <dt>{tArtwork("labels.year")}</dt>
              <dd>{artwork.year ?? "N/A"}</dd>
            </div>
            <div>
              <dt>{tArtwork("labels.technique")}</dt>
              <dd>{artwork.medium}</dd>
            </div>
            <div>
              <dt>{tArtwork("labels.size")}</dt>
              <dd>{artwork.dimensions}</dd>
            </div>
            <div>
              <dt>{tArtwork("labels.status")}</dt>
              <dd>{tStatuses(artwork.status)}</dd>
            </div>
          </dl>
          <p className={styles.description}>{artwork.description}</p>
          <div className={styles.actions}>
            <Button
              href={`/${locale}/contacts?artworkId=${artwork.id}&artworkTitle=${encodeURIComponent(artwork.title)}`}
            >
              {tArtwork("contactButton")}
            </Button>
            <Button href={`/${locale}/gallery`} variant="secondary">
              {tArtwork("backButton")}
            </Button>
          </div>
        </div>
      </Container>

      {relatedWorks.length > 0 ? (
        <Container className={styles.relatedSection}>
          <div className={styles.related}>
            <p className={styles.relatedEyebrow}>{tArtwork("relatedEyebrow")}</p>
            <ArtworkCarousel items={relatedWorks} locale={locale} variant="related" />
          </div>
        </Container>
      ) : null}
    </section>
  );
}
