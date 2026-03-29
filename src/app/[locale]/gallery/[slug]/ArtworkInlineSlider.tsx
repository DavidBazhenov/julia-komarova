"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import styles from "@/app/(public)/gallery/[slug]/artwork.module.css";
import { shouldBypassImageOptimization } from "@/shared/lib/images";

type ArtworkInlineSliderImage = {
  id: string;
  alt: string;
  displayUrl: string;
  thumbnailUrl: string;
};

type ArtworkInlineSliderProps = {
  title: string;
  images: ArtworkInlineSliderImage[];
  labels: {
    open: string;
    close: string;
    previous: string;
    next: string;
  };
};

export function ArtworkInlineSlider({ title, images, labels }: ArtworkInlineSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const lightboxMediaRef = useRef<HTMLDivElement | null>(null);

  function resetZoom() {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setOrigin({ x: 50, y: 50 });
    setIsDragging(false);
    dragStateRef.current = null;
  }

  useEffect(() => {
    if (lightboxIndex === null) {
      resetZoom();
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLightboxIndex(null);
        return;
      }

      if (event.key === "ArrowRight") {
        resetZoom();
        setLightboxIndex((current) => {
          if (current === null) return current;
          return (current + 1) % images.length;
        });
      }

      if (event.key === "ArrowLeft") {
        resetZoom();
        setLightboxIndex((current) => {
          if (current === null) return current;
          return (current - 1 + images.length) % images.length;
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [images.length, lightboxIndex]);

  useEffect(() => {
    resetZoom();
  }, [lightboxIndex]);

  useEffect(() => {
    if (images.length === 0) {
      setActiveIndex(0);
      setLightboxIndex(null);
      return;
    }

    if (activeIndex >= images.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, images.length]);

  if (images.length === 0) {
    return null;
  }

  const activeImage = images[activeIndex];
  const resolvedLightboxIndex = lightboxIndex ?? 0;
  const lightboxImage = lightboxIndex === null ? null : images[lightboxIndex];

  function showPrevious() {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % images.length);
  }

  function changeScale(nextScale: number, clientX?: number, clientY?: number) {
    const clampedScale = Math.min(6, Math.max(1, nextScale));
    const container = lightboxMediaRef.current;

    if (container && clientX != null && clientY != null) {
      const rect = container.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      setOrigin({
        x: Math.min(100, Math.max(0, x)),
        y: Math.min(100, Math.max(0, y)),
      });
    }

    if (clampedScale === 1) {
      setPan({ x: 0, y: 0 });
    }

    setScale(clampedScale);
  }

  function onWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
    changeScale(scale * factor, event.clientX, event.clientY);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (scale <= 1) {
      return;
    }

    setIsDragging(true);
    dragStateRef.current = {
      x: pan.x,
      y: pan.y,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStateRef.current || scale <= 1) {
      return;
    }

    const nextX = dragStateRef.current.x + (event.clientX - dragStateRef.current.startX);
    const nextY = dragStateRef.current.y + (event.clientY - dragStateRef.current.startY);
    setPan({ x: nextX, y: nextY });
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDragging(false);
    dragStateRef.current = null;
  }

  return (
    <>
      <div className={styles.inlineSlider}>
        <div className={styles.sliderStage}>
          <div className={styles.heroFrame}>
            <div className={styles.heroMedia}>
              <Image
                src={activeImage.displayUrl}
                alt={activeImage.alt || title}
                fill
                priority
                sizes="(min-width: 960px) 58vw, 100vw"
                unoptimized={shouldBypassImageOptimization(activeImage.displayUrl)}
                className={styles.heroImage}
              />
            </div>
            <button
              type="button"
              className={styles.lightboxTrigger}
              onClick={() => setLightboxIndex(activeIndex)}
              aria-label={labels.open}
            />
          </div>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                className={`${styles.inlineSliderNav} ${styles.inlineSliderPrev}`}
                onClick={showPrevious}
                aria-label={labels.previous}
              >
                ‹
              </button>
              <button
                type="button"
                className={`${styles.inlineSliderNav} ${styles.inlineSliderNext}`}
                onClick={showNext}
                aria-label={labels.next}
              >
                ›
              </button>
              <div className={styles.inlineSliderCounter}>
                {activeIndex + 1} / {images.length}
              </div>
            </>
          ) : null}
        </div>

      </div>

      {lightboxImage ? (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setLightboxIndex(null)}
        >
          <div className={styles.lightboxInner} onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setLightboxIndex(null)}
              aria-label={labels.close}
            >
              ×
            </button>

            {images.length > 1 ? (
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={() => {
                  resetZoom();
                  setLightboxIndex((resolvedLightboxIndex - 1 + images.length) % images.length);
                }}
                aria-label={labels.previous}
              >
                ‹
              </button>
            ) : null}

            <button
              type="button"
              className={styles.lightboxZoom}
              onClick={() => changeScale(scale + 0.4)}
              aria-label="Zoom in"
            >
              +
            </button>

            <button
              type="button"
              className={`${styles.lightboxZoom} ${styles.lightboxZoomOut}`}
              onClick={() => changeScale(scale - 0.4)}
              aria-label="Zoom out"
            >
              −
            </button>

            <div className={styles.lightboxFrame}>
              <div
                ref={lightboxMediaRef}
                className={`${styles.lightboxMedia} ${scale > 1 ? styles.lightboxMediaZoomed : ""} ${
                  isDragging ? styles.lightboxMediaDragging : ""
                }`}
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <div
                  className={styles.lightboxImageCanvas}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                    transformOrigin: `${origin.x}% ${origin.y}%`,
                  }}
                >
                  {/* Lightbox uses a raw image node for pointer-driven zoom and pan. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lightboxImage.displayUrl}
                    alt={lightboxImage.alt || title}
                    className={styles.lightboxImage}
                    draggable={false}
                  />
                </div>
              </div>
            </div>

            {images.length > 1 ? (
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={() => {
                  resetZoom();
                  setLightboxIndex((resolvedLightboxIndex + 1) % images.length);
                }}
                aria-label={labels.next}
              >
                ›
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
