import { redirect } from "next/navigation";

import { isLocale } from "@/app/[locale]/content";

export default async function LocalizedAdminRedirectPage({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { locale, slug } = await params;

  if (!isLocale(locale)) {
    redirect("/admin");
  }

  const suffix = slug && slug.length > 0 ? `/${slug.join("/")}` : "";
  redirect(`/admin${suffix}`);
}
