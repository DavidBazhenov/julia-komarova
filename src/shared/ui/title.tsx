import type { ReactNode } from "react";

import { cn } from "../lib/cn";

import styles from "./title.module.css";

type TitleProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function Title({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: TitleProps) {
  return (
    <header className={cn(styles.titleBlock, styles[align], className)}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h2 className={styles.title}>{title}</h2>
      {description ? <div className={styles.description}>{description}</div> : null}
    </header>
  );
}
