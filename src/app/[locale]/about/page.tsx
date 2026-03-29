import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import aboutPortrait from "../../../../public/images/about.jpg";
import logoImage from "../../../../public/images/jk-logo.png";

import {
  createLocalizedPageMetadata,
  isLocale,
  type Locale,
} from "@/app/[locale]/content";
import { Container } from "@/shared/ui";
import styles from "../../(public)/about/about.module.css";

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
  const tAbout = await getTranslations({ locale, namespace: "About" });

  return createLocalizedPageMetadata(locale, {
    title: tAbout("title"),
    description: tAbout("paragraphs.first"),
    path: "/about",
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const tAbout = await getTranslations({ locale, namespace: "About" });

  return (
    <Container>
      <section className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.logoBlock}>
            <Image
              src={logoImage}
              alt={locale === "ru" ? "Логотип Юлии Комаровой" : "Julia Komarova logo"}
              width={1800}
              height={620}
              priority
              className={styles.logo}
            />
          </div>
        </header>

        <div className={styles.portraitBlock}>
          <div className={styles.portraitFrame}>
            <Image
              src={aboutPortrait}
              alt={locale === "ru" ? "Портрет Юлии Комаровой" : "Portrait of Julia Komarova"}
              fill
              sizes="(max-width: 767px) 78vw, 22rem"
              className={styles.portrait}
            />
          </div>
        </div>

        <section className={styles.textComposition}>
          <p className={`${styles.freeParagraph} ${styles.p1}`}>{tAbout("sections.artist.text")}</p>
          <p className={`${styles.freeParagraph} ${styles.p2}`}>{tAbout("lead")}</p>
          <p className={`${styles.freeParagraph} ${styles.p3}`}>{tAbout("sections.works.text")}</p>
        </section>

        <section className={styles.statementSection}>
          <div className={styles.statementLabel}>{tAbout("sections.approach.title")}</div>
          <div className={styles.statementBody}>
            <p className={`${styles.statementParagraph} ${styles.s1}`}>
              {tAbout("sections.techniques.title")}: {tAbout("sections.techniques.text")}.
            </p>
            <p className={`${styles.statementParagraph} ${styles.s2}`}>
              {tAbout("sections.directions.title")}: {tAbout("sections.directions.items.0")}, {tAbout("sections.directions.items.1")}, {tAbout("sections.directions.items.2")}.
            </p>
            <p className={`${styles.statementParagraph} ${styles.s3}`}>{tAbout("sections.approach.text")}</p>
            <p className={`${styles.statementParagraph} ${styles.s4}`}>{tAbout("sections.now.text")}</p>
          </div>
        </section>
      </section>
    </Container>
  );
}
