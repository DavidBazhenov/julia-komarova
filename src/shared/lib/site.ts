import {defaultLocale, supportedLocales} from "./i18n";

export const siteConfig = {
  name: "Julia Komarova",
  title: "Julia Komarova | Художник | Интерьерная живопись",
  description: "Julia Komarova creates interior paintings, author series, and commissioned works.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://juliakomarova.art",
  locales: supportedLocales,
  defaultLocale,
  palette: {
    background: "#FFFCEB",
    accent: "#325118"
  }
} as const;
