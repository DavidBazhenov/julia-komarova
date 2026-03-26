"use client";

import { usePathname } from "next/navigation";

import {
  buildLocaleLanguagePath,
  type Locale
} from "@/app/[locale]/content";
import { Button } from "../../shared/ui";

export function LocaleSwitch({
  locale,
  label,
  className,
}: {
  locale: Locale;
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  const targetLocale: Locale = locale === "en" ? "ru" : "en";
  const targetPath = buildLocaleLanguagePath(targetLocale, pathname);

  return (
    <Button href={targetPath} variant="secondary" className={className}>
      {label}
    </Button>
  );
}
