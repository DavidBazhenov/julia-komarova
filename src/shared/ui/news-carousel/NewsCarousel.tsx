"use client";

import Image from "next/image";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import type { LocalizedExhibitionItem } from "@/app/[locale]/content";

import styles from "./NewsCarousel.module.css";

type NewsCarouselProps = {
  items: LocalizedExhibitionItem[];
  fallbackHref: string;
};

function formatYear(value: string): string {
  return new Date(value).getFullYear().toString();
}

export function NewsCarousel({ items, fallbackHref }: NewsCarouselProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={styles.root}>
      {items.length > 1 ? (
        <>
          <button type="button" className={`${styles.navButton} ${styles.navPrev}`} aria-label="Previous slide">
            ‹
          </button>
          <button type="button" className={`${styles.navButton} ${styles.navNext}`} aria-label="Next slide">
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
                prevEl: `.${styles.navPrev}`,
                nextEl: `.${styles.navNext}`,
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
        {items.map((item) => {
          const href = item.sourceUrl || fallbackHref;
          const meta = [item.venue, item.city || item.country, formatYear(item.startDate)]
            .filter(Boolean)
            .join(" · ");

          return (
            <SwiperSlide key={item.slug} className={styles.slide}>
              <a
                href={href}
                target={item.sourceUrl ? "_blank" : undefined}
                rel={item.sourceUrl ? "noreferrer noopener" : undefined}
                className={styles.card}
              >
                <div className={styles.frame}>
                  {item.posterImageUrl ? (
                    <Image
                      src={item.posterImageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 767px) 70vw, (max-width: 959px) 42vw, 28vw"
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.placeholder} />
                  )}
                </div>
                <div className={styles.meta}>
                  <p className={styles.eyebrow}>{item.category?.title || item.label}</p>
                  <h3 className={styles.title}>{item.title}</h3>
                  <p className={styles.subtitle}>{meta}</p>
                </div>
              </a>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
