"use client";

import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import type { LocalizedArtworkListItem, Locale } from "@/app/[locale]/content";
import { ArtworkCard } from "@/shared/ui/artwork-card";

import styles from "./ArtworkCarousel.module.css";

type ArtworkCarouselProps = {
  items: LocalizedArtworkListItem[];
  locale: Locale;
  variant: "home" | "related";
};

export function ArtworkCarousel({ items, locale, variant }: ArtworkCarouselProps) {
  const prevSelectorClass = variant === "home" ? styles.homePrev : styles.relatedPrev;
  const nextSelectorClass = variant === "home" ? styles.homeNext : styles.relatedNext;
  const prevClass = `${styles.navButton} ${styles.navPrev} ${prevSelectorClass}`;
  const nextClass = `${styles.navButton} ${nextSelectorClass}`;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={styles.root}>
      {items.length > 1 ? (
        <>
          <button type="button" className={prevClass} aria-label="Previous slide">
            ‹
          </button>
          <button type="button" className={nextClass} aria-label="Next slide">
            ›
          </button>
        </>
      ) : null}

      <Swiper
        className={styles.swiper}
        modules={[Navigation]}
        navigation={
          items.length > 1
            ? {
                prevEl: `.${prevSelectorClass}`,
                nextEl: `.${nextSelectorClass}`,
              }
            : false
        }
        spaceBetween={18}
        slidesPerView={1.12}
        breakpoints={{
          640: {
            slidesPerView: 1.6,
          },
          960: {
            slidesPerView: 3,
          },
        }}
      >
        {items.map((item) => (
          <SwiperSlide key={item.slug} className={styles.slide}>
            <ArtworkCard
              href={`/${locale}/gallery/${item.slug}`}
              title={item.title}
              eyebrow={item.series}
              subtitle={`${item.series}${item.year ? ` · ${item.year}` : ""}`}
              price={item.price ?? undefined}
              imageUrl={
                item.coverImage
                  ? variant === "home"
                    ? item.coverImage.displayUrl
                    : item.coverImage.thumbnailUrl
                  : null
              }
              imageAlt={item.coverImage?.alt || item.title}
              tone={item.tone}
              variant={variant}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
