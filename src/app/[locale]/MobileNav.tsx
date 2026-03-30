"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { buildLocaleLanguagePath, buildLocalePath, type Locale } from "@/app/[locale]/content";

import styles from "../(public)/public-layout.module.css";

type MobileNavProps = {
  locale: Locale;
  labels: {
    home: string;
    gallery: string;
    about: string;
    contacts: string;
    menu: string;
    close: string;
  };
};

export function MobileNav({ locale, labels }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const items = [
    { href: buildLocalePath(locale, "/"), label: labels.home },
    { href: buildLocalePath(locale, "/gallery"), label: labels.gallery },
    { href: buildLocalePath(locale, "/about"), label: labels.about },
    { href: buildLocalePath(locale, "/contacts"), label: labels.contacts },
    {
      href: buildLocaleLanguagePath(locale === "en" ? "ru" : "en", buildLocalePath(locale, "/")),
      label: locale === "ru" ? "EN" : "RU",
    },
  ];

  return (
    <>
      <button
        type="button"
        className={styles.mobileMenuButton}
        aria-expanded={open}
        aria-controls="mobile-site-nav"
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.mobileMenuIcon} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {mounted
        ? createPortal(
            <>
              {open ? (
                <button
                  type="button"
                  className={styles.mobileNavBackdrop}
                  onClick={() => setOpen(false)}
                  aria-label={labels.close}
                />
              ) : null}

              <div
                id="mobile-site-nav"
                className={open ? `${styles.mobileNavShell} ${styles.mobileNavShellOpen}` : styles.mobileNavShell}
              >
                <div className={styles.mobileNavPanel}>
                  <nav className={styles.mobileNavList} aria-label="Mobile">
                    {items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={styles.mobileNavLink}
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
