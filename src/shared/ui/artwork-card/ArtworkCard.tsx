import Image from "next/image";
import Link from "next/link";

import styles from "./ArtworkCard.module.css";

type ArtworkCardProps = {
  href: string;
  title: string;
  subtitle: string;
  eyebrow?: string;
  imageUrl?: string | null;
  imageAlt?: string;
  tone?: "forest" | "moss" | "dawn" | "mist";
  variant: "home" | "gallery" | "related";
};

export function ArtworkCard({
  href,
  title,
  subtitle,
  eyebrow,
  imageUrl,
  imageAlt,
  tone = "forest",
  variant,
}: ArtworkCardProps) {
  return (
    <Link href={href} className={styles.card}>
      <div className={styles.frame} data-variant={variant}>
        <div className={styles.media}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt || title}
              fill
              sizes="(min-width: 960px) 30vw, 90vw"
              className={styles.image}
            />
          ) : (
            <div className={styles.fallback} data-tone={tone} />
          )}
        </div>
      </div>
      <div className={styles.meta}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </Link>
  );
}
