import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import {
  buildLocalePath,
  getStaticLocaleParams,
  isLocale,
  type Locale,
} from "@/app/[locale]/content";
import { Button, Container } from "../../shared/ui";

import { LocaleDocumentLang } from "./LocaleDocumentLang";
import { LocaleSwitch } from "./LocaleSwitch";
import { MobileNav } from "./MobileNav";
import styles from "../(public)/public-layout.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return getStaticLocaleParams();
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  setRequestLocale(locale);
  const [tNav, tHome] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Home" }),
  ]);

  return (
    <div className={styles.shell}>
      <LocaleDocumentLang locale={locale} />
      <header className={styles.header}>
        <Container className={styles.headerInner}>
          <Link href={buildLocalePath(locale, "/")} className={styles.brand} aria-label="Julia Komarova">
            <Image
              src="/images/jk-logo.png"
              alt="Julia Komarova logo"
              width={1449}
              height={736}
              priority
              className={styles.brandLogo}
            />
          </Link>

          <nav className={styles.nav} aria-label="Main">
            <Link href={buildLocalePath(locale, "/")} className={styles.navLink}>
              {tNav("home")}
            </Link>
            <Link href={buildLocalePath(locale, "/gallery")} className={styles.navLink}>
              {tNav("gallery")}
            </Link>
            <Link href={buildLocalePath(locale, "/exhibitions")} className={styles.navLink}>
              {tNav("exhibitions")}
            </Link>
            <Link href={buildLocalePath(locale, "/about")} className={styles.navLink}>
              {tNav("about")}
            </Link>
          </nav>

          <div className={styles.headerActions}>
            <LocaleSwitch locale={locale} label={tNav("switchLabel")} className={styles.localeSwitch} />
            <Button href={buildLocalePath(locale, "/contacts")} variant="secondary" className={styles.cta}>
              {tNav("contacts")}
            </Button>
            <MobileNav
              locale={locale}
              labels={{
                home: tNav("home"),
                gallery: tNav("gallery"),
                exhibitions: tNav("exhibitions"),
                about: tNav("about"),
                contacts: tNav("contacts"),
                menu: locale === "ru" ? "Меню" : "Menu",
                close: locale === "ru" ? "Закрыть" : "Close",
              }}
            />
          </div>
        </Container>
      </header>

      <main>{children}</main>

      <footer className={styles.footer}>
        <Container className={styles.footerInner}>
          <div className={styles.footerTop}>
            <Link href={buildLocalePath(locale, "/")} className={styles.footerBrand} aria-label="Julia Komarova">
              <Image
                src="/images/jk-logo.png"
                alt="Julia Komarova logo"
                width={1449}
                height={736}
                className={styles.footerLogo}
              />
            </Link>

            <div className={styles.footerColumns}>
              <div className={styles.footerColumn}>
                <p className={styles.footerLabel}>{locale === "ru" ? "Навигация" : "Navigation"}</p>
                <nav className={styles.footerNav} aria-label="Footer">
                  <Link className={styles.footerLink} href={buildLocalePath(locale, "/")}>
                    {tNav("home")}
                  </Link>
                  <Link className={styles.footerLink} href={buildLocalePath(locale, "/gallery")}>
                    {tNav("gallery")}
                  </Link>
                  <Link className={styles.footerLink} href={buildLocalePath(locale, "/exhibitions")}>
                    {tNav("exhibitions")}
                  </Link>
                  <Link className={styles.footerLink} href={buildLocalePath(locale, "/about")}>
                    {tNav("about")}
                  </Link>
                  <Link className={styles.footerLink} href={buildLocalePath(locale, "/contacts")}>
                    {tNav("contacts")}
                  </Link>
                </nav>
              </div>

              <div className={styles.footerColumn}>
                <p className={styles.footerLabel}>
                  {locale === "ru" ? "Контакты и соцсети" : "Contact & social"}
                </p>
                <div className={styles.footerContactList}>
                  <a className={styles.footerLink} href="mailto:hello@juliakomarova.art">
                    hello@juliakomarova.art
                  </a>
                  <a className={styles.footerLink} href="https://instagram.com/juliakomarova.art" target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                  <a className={styles.footerLink} href="https://vk.com/juliakomarova" target="_blank" rel="noreferrer">
                    VK
                  </a>
                  <a className={styles.footerLink} href="https://t.me/julia_komarova_studio" target="_blank" rel="noreferrer">
                    Telegram
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>© {new Date().getFullYear()} Julia Komarova</p>
            <p>{locale === "ru" ? "Художник | Интерьерная живопись" : "Artist | Interior painting"}</p>
            <p>{tHome("contactDescription")}</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
