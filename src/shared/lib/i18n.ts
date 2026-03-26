export const locales = ["ru", "en"] as const;

export type Locale = (typeof locales)[number];

export type SiteLocale = Locale;

export type LocaleCopy<T> = Record<SiteLocale, T>;

export const defaultLocale: Locale = "ru";

export const supportedLocales = locales;

const localeSet = new Set<string>(locales);

export function isLocale(value: string): value is Locale {
  return localeSet.has(value);
}

export function isSiteLocale(value: string): value is SiteLocale {
  return isLocale(value);
}

export function normalizeLocale(value?: string | null): SiteLocale {
  if (!value) return defaultLocale;

  const normalized = value.trim().toLowerCase();
  return isSiteLocale(normalized) ? normalized : defaultLocale;
}

export function getAlternateLocale(locale: SiteLocale): SiteLocale {
  return locale === "ru" ? "en" : "ru";
}

export function getLocaleDisplayName(locale: SiteLocale): string {
  return locale === "ru" ? "RU" : "EN";
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const [, firstSegment] = pathname.split("/");
  return firstSegment && isLocale(firstSegment) ? firstSegment : null;
}

export function localizedPathname(locale: Locale, pathname = "/"): string {
  const normalized = pathname === "/" ? "" : pathname.replace(/^\/+/, "");
  return normalized ? `/${locale}/${normalized}` : `/${locale}`;
}

export function localizePath(path = "/", locale: SiteLocale = defaultLocale): string {
  return localizedPathname(locale, path);
}

export function stripLocalePrefix(pathname: string): {
  locale: SiteLocale;
  path: string;
} {
  const segments = pathname.split("/").filter(Boolean);
  const [maybeLocale, ...rest] = segments;

  if (maybeLocale && isSiteLocale(maybeLocale)) {
    const path = `/${rest.join("/")}`;
    return {
      locale: maybeLocale,
      path: path === "/" ? "/" : path || "/",
    };
  }

  return {
    locale: defaultLocale,
    path: pathname || "/",
  };
}

export function pickLocalizedValue(
  locale: SiteLocale,
  values: {
    ru?: string | null;
    en?: string | null;
    fallback?: string | null;
  },
): string | null {
  const preferred = locale === "ru" ? values.ru : values.en;
  if (preferred && preferred.trim().length > 0) {
    return preferred.trim();
  }

  const alternate = locale === "ru" ? values.en : values.ru;
  if (alternate && alternate.trim().length > 0) {
    return alternate.trim();
  }

  if (values.fallback && values.fallback.trim().length > 0) {
    return values.fallback.trim();
  }

  return null;
}
