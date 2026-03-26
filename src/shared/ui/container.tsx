import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn";

import styles from "./container.module.css";

type ContainerProps = HTMLAttributes<HTMLDivElement>;

export function Container({ className, ...props }: ContainerProps) {
  return <div className={cn(styles.container, className)} {...props} />;
}
