"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import styles from "@/app/(public)/gallery/[slug]/artwork.module.css";

type ArtworkLightboxImage = {
  id: string;
  alt: string;
  displayUrl: string;
};

type ArtworkLightboxProps = {
  title: string;
  images: ArtworkLightboxImage[];
  labels: {
    open: string;
    close: string;
    previous: string;
    next: string;
  };
};

export function ArtworkLightbox({ title, images, labels }: ArtworkLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (activeIndex === null) {
      setZoomed(false);
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
        return;
      }

      if (event.key === "ArrowRight") {
        setZoomed(false);
        setActiveIndex((current) => {
          if (current === null) {
            return current;
          }

          return (current + 1) % images.length;
        });
      }

      if (event.key === "ArrowLeft") {
        setZoomed(false);
        setActiveIndex((current) => {
          if (current === null) {
            return current;
          }

          return (current - 1 + images.length) % images.length;
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, images.length]);

  const activeImage = activeIndex === null ? null : images[activeIndex];
  const resolvedActiveIndex = activeIndex ?? 0;

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      {activeImage ? (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setActiveIndex(null)}
        >
          <div className={styles.lightboxInner} onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setActiveIndex(null)}
              aria-label={labels.close}
            >
              ×
            </button>

            {images.length > 1 ? (
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={() => {
                  setZoomed(false);
                  setActiveIndex((resolvedActiveIndex - 1 + images.length) % images.length);
                }}
                aria-label={labels.previous}
              >
                ‹
              </button>
            ) : null}

            <button
              type="button"
              className={styles.lightboxZoom}
              onClick={() => setZoomed((current) => !current)}
              aria-label={zoomed ? "Zoom out" : "Zoom in"}
            >
              {zoomed ? "−" : "+"}
            </button>

            <div className={styles.lightboxFrame}>
              <div
                className={`${styles.lightboxMedia} ${zoomed ? styles.lightboxMediaZoomed : ""}`}
                onClick={() => setZoomed((current) => !current)}
              >
                <Image
                  src={activeImage.displayUrl}
                  alt={activeImage.alt || title}
                  fill
                  sizes="100vw"
                  className={`${styles.lightboxImage} ${zoomed ? styles.lightboxImageZoomed : ""}`}
                />
              </div>
            </div>

            {images.length > 1 ? (
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={() => {
                  setZoomed(false);
                  setActiveIndex((resolvedActiveIndex + 1) % images.length);
                }}
                aria-label={labels.next}
              >
                ›
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className={styles.lightboxTrigger}
        onClick={() => setActiveIndex(0)}
        aria-label={labels.open}
      />
    </>
  );
}
