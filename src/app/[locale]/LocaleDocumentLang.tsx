"use client";

import { useEffect } from "react";

import type { Locale } from "@/shared/lib/i18n";

export function LocaleDocumentLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
