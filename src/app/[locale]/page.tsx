import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";

import { Button, Container, NewsCarousel, Section } from "../../shared/ui";
import { ArtworkCarousel } from "../../shared/ui/artwork-carousel";

import {
  createLocalizedPageMetadata,
  isLocale,
  loadLocalizedHomeData,
  type Locale,
} from "@/app/[locale]/content";
import { siteConfig } from "@/shared/lib/site";
import { buildArtistStructuredData, buildWebsiteStructuredData } from "@/shared/lib/structured-data";
import styles from "../(public)/home.module.css";

export const revalidate = 300;

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
  const tHome = await getTranslations({ locale, namespace: "Home" });

  return createLocalizedPageMetadata(locale, {
    title: siteConfig.title,
    description: tHome("lead"),
    path: "/",
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const [tNav, tHome, tStructured] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Home" }),
    getTranslations({ locale, namespace: "StructuredData" }),
  ]);
  const data = await loadLocalizedHomeData(locale);
  const heroImageSrc = "/images/hero-home.jpg";
  const homeAboutImageSrc = "/images/about-photo.jpg?v=20260326";
  const heroImageAlt =
    data.featuredArtworks[0]?.coverImage?.alt ||
    data.featuredArtworks[0]?.title ||
    (locale === "ru" ? "Картина Юлии Комаровой" : "Painting by Julia Komarova");
  const structuredData = [
    buildArtistStructuredData({
      locale,
      jobTitle: tStructured("artistJobTitle"),
      description: tStructured("artistDescription"),
    }),
    buildWebsiteStructuredData(locale),
  ];
  const aboutLead =
    locale === "ru"
      ? "Окончила Московский государственный университет печати — один из ведущих вузов в области дизайна и издательского дела."
      : "Graduated from the Moscow State University of Printing Arts, one of the leading institutions in design and publishing.";
  const aboutSecondary =
    locale === "ru"
      ? "Имею профессиональный опыт в дизайне и полиграфии, который сформировал точное чувство композиции и цвета. Сегодня полностью сосредоточена на живописи и графике."
      : "Professional experience in design and print shaped a precise sense of composition and color. Today fully focused on painting and graphics.";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className={styles.hero}>
        <div className={styles.heroVisual}>
          <div className={styles.heroFrame}>
            <div className={styles.heroImage}>
              <Image
                src={heroImageSrc}
                alt={heroImageAlt}
                fill
                priority
                sizes="100vw"
                className={styles.heroPainting}
              />
              <div className={styles.heroOverlay}>
                <h1 className={styles.heroOverlayTitle}>Julia Komarova</h1>
                <p className={styles.heroOverlayRole}>
                  {locale === "ru" ? "Художник | Интерьерная живопись" : "Artist | Interior painting"}
                </p>
                <div className={`${styles.heroActions} ${styles.heroActionsOverlay}`}>
                  <Button href={`/${locale}/gallery`}>{tNav("gallery")}</Button>
                  <Button href={`/${locale}/contacts`} variant="secondary">
                    {tHome("contactButton")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.aboutSection}>
        <Container className={styles.aboutEditorial}>
          <div className={styles.aboutIntro}>
            <p className={styles.aboutSummary}>{aboutLead}</p>
          </div>

          <div className={styles.aboutMediaRow}>
            <div className={styles.aboutPhotoBlock}>
              <div className={styles.aboutPhotoFrame}>
                <Image
                  src={homeAboutImageSrc}
                  alt={locale === "ru" ? "Портрет Юлии Комаровой" : "Portrait of Julia Komarova"}
                  width={736}
                  height={919}
                  sizes="(max-width: 767px) 100vw, 38rem"
                  className={styles.aboutPhoto}
                />
              </div>
              <span className={styles.aboutPhotoNote}>
                {locale === "ru" ? "СТУДИЯ / МОСКВА" : "STUDIO / MOSCOW"}
              </span>
            </div>

            <p className={styles.aboutSecondary}>{aboutSecondary}</p>
          </div>

          <div className={styles.sectionLinkRow}>
            <Link href={`/${locale}/about`} className={styles.sectionLink}>
              {tNav("about")}
            </Link>
          </div>
        </Container>
      </section>

      <Section title={tHome("featuredTitle")}>
        <ArtworkCarousel items={data.featuredArtworks} locale={locale} variant="home" />
        <div className={styles.sectionLinkRow}>
          <Link href={`/${locale}/gallery`} className={styles.sectionLink}>
            {tHome("featuredMore")}
          </Link>
        </div>
      </Section>

      <Section title={tHome("newsTitle")}>
        <NewsCarousel items={data.exhibitions} fallbackHref={`/${locale}/exhibitions`} />
        <div className={styles.sectionLinkRow}>
          <Link href={`/${locale}/exhibitions`} className={styles.sectionLink}>
            {tHome("newsMore")}
          </Link>
        </div>
      </Section>

    </>
  );
}
