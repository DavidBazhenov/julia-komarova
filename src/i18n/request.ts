import {getRequestConfig} from "next-intl/server";

import {defaultLocale, isLocale, type Locale} from "@/shared/lib/i18n";

import {messages} from "./messages";

export default getRequestConfig(async ({locale, requestLocale}) => {
  const resolvedRequestLocale = locale ?? (await requestLocale);
  const resolvedLocale: Locale = isLocale(resolvedRequestLocale ?? "")
    ? (resolvedRequestLocale as Locale)
    : defaultLocale;

  return {
    locale: resolvedLocale,
    messages: messages[resolvedLocale]
  };
});
