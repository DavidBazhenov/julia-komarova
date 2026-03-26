import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactElement,
  ReactNode,
} from "react";

import { cn } from "../lib/cn";

import styles from "./button.module.css";

type CommonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

type LinkProps = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
type ActionProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

export function Button(props: LinkProps): ReactElement;
export function Button(props: ActionProps): ReactElement;
export function Button({
  children,
  variant = "primary",
  className,
  href,
  ...props
}: LinkProps | ActionProps) {
  const classNames = cn(styles.button, styles[variant], className);

  if (typeof href === "string") {
    return (
      <Link className={classNames} href={href} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classNames} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
