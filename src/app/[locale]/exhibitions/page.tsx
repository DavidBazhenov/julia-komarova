import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "../../../shared/ui";

import {
  createLocalizedPageMetadata,
  isLocale,
  loadLocalizedExhibitionsByCategory,
  type Locale,
} from "@/app/[locale]/content";

import styles from "../../(public)/exhibitions/exhibitions.module.css";

export const revalidate = 300;

function formatYear(date: string): string {
  return String(new Date(date).getUTCFullYear());
}

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
  const tExhibitions = await getTranslations({ locale, namespace: "Exhibitions" });

  return createLocalizedPageMetadata(locale, {
    title: tExhibitions("title"),
    description: tExhibitions("description"),
    path: "/exhibitions",
  });
}

export default async function ExhibitionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const tExhibitions = await getTranslations({ locale, namespace: "Exhibitions" });
  const categories = await loadLocalizedExhibitionsByCategory(locale);

  return (
    <Container>
      <section className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{tExhibitions("eyebrow")}</p>
          <h1 className={styles.pageTitle}>{tExhibitions("title")}</h1>
          <p className={styles.description}>{tExhibitions("description")}</p>
        </header>

        <div className={styles.sections}>
          {categories.map((category) => (
            <section key={category.id} className={styles.section} aria-labelledby={`exhibitions-${category.slug}`}>
              <h2 id={`exhibitions-${category.slug}`} className={styles.sectionTitle}>
                {category.title}
              </h2>

              {category.exhibitions.length === 0 ? (
                <p className={styles.empty}>{tExhibitions("empty")}</p>
              ) : (
                <ol className={styles.table}>
                  {category.exhibitions.map((item, index) => {
                    const title = item.sourceUrl ? (
                      <Link href={item.sourceUrl} target="_blank" rel="noreferrer" className={styles.titleLink}>
                        {item.title}
                      </Link>
                    ) : (
                      <span className={styles.titleText}>{item.title}</span>
                    );

                    return (
                      <li key={item.id} className={styles.row}>
                        <span className={styles.index}>{index + 1}.</span>
                        <div className={styles.work}>{title}</div>
                        <div className={styles.venue}>{item.venue}</div>
                        <div className={styles.year}>{formatYear(item.startDate)}</div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          ))}
        </div>
      </section>
    </Container>
  );
}
