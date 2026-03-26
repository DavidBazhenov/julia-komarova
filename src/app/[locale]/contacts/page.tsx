import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "../../../shared/ui";

import { ContactsForm } from "./ContactsForm";
import {
  createLocalizedPageMetadata,
  isLocale,
  type Locale,
} from "@/app/[locale]/content";
import styles from "../../(public)/contacts/contacts.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const tContacts = await getTranslations({ locale, namespace: "Contacts" });

  return createLocalizedPageMetadata(locale, {
    title: tContacts("title"),
    description: tContacts("lead"),
    path: "/contacts",
  });
}

type ContactsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    sent?: string;
    error?: string;
    artworkId?: string;
    artworkTitle?: string;
  }>;
};

export default async function ContactsPage({
  params,
  searchParams,
}: ContactsPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const artworkTitle = resolvedSearchParams?.artworkTitle?.trim();
  const artworkId = resolvedSearchParams?.artworkId?.trim();
  const contextualMessage = artworkTitle
    ? `Интересует работа «${artworkTitle}».\n\n`
    : "";
  const [tContacts, tGallery] = await Promise.all([
    getTranslations({ locale, namespace: "Contacts" }),
    getTranslations({ locale, namespace: "Gallery" }),
  ]);

  return (
    <Container>
      <section className={styles.page}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>{tContacts("eyebrow")}</p>
          <h1 className={styles.title}>{tContacts("title")}</h1>
        </div>

        <div className={styles.card}>
          <ContactsForm
            locale={locale}
            artworkId={artworkId ?? undefined}
            contextualMessage={contextualMessage}
            copy={{
              submit: tContacts("form.submit"),
              success: tContacts("form.success"),
              missing: tContacts("form.missing"),
              failed: tContacts("form.failed"),
              name: tContacts("form.name"),
              contact: tContacts("form.contact"),
              contactPlaceholder: tContacts("form.contactPlaceholder"),
              message: tContacts("form.message"),
              askButton: tGallery("askButton"),
            }}
          />
        </div>
      </section>
    </Container>
  );
}
