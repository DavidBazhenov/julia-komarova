import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

import { Container } from "./container";
import styles from "./section.module.css";
import { Title } from "./title";

type SectionProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: string;
  title?: string;
  description?: ReactNode;
  children: ReactNode;
};

export function Section({
  eyebrow,
  title,
  description,
  children,
  className,
  ...props
}: SectionProps) {
  return (
    <section className={cn(styles.section, className)} {...props}>
      <Container>
        {title ? (
          <Title eyebrow={eyebrow} title={title} description={description} />
        ) : null}
        {children}
      </Container>
    </section>
  );
}
