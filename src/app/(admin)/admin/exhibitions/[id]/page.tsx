import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getExhibitionAdminById } from "@/features/exhibitions";
import { listAdminExhibitionCategories } from "@/features/exhibition-categories";
import { readAdminSession } from "@/server/auth";

import { updateExhibitionAction } from "../../actions";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export default async function AdminExhibitionEditPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { updated?: string; error?: string };
}) {
  const session = await readAdminSession();
  if (!session) {
    redirect(`/admin/login?next=/admin/exhibitions/${params.id}`);
  }

  const exhibition = await getExhibitionAdminById(params.id);
  const categories = await listAdminExhibitionCategories({ visibleOnly: false });
  if (!exhibition) {
    notFound();
  }

  return (
    <section className={styles.entityGrid}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Exhibitions</p>
        <h1 className={styles.panelTitle}>Edit exhibition</h1>
        <p className={styles.helper}>
          <Link href="/admin/exhibitions" className={styles.entityLink}>
            Back to exhibitions
          </Link>
        </p>
        {searchParams?.updated ? <p className={styles.notice}>Exhibition updated.</p> : null}
        {searchParams?.error ? (
          <p className={styles.error}>{decodeURIComponent(searchParams.error)}</p>
        ) : null}
        <form action={updateExhibitionAction} className={styles.form}>
          <input type="hidden" name="exhibitionId" value={exhibition.id} />
          <input type="hidden" name="returnTo" value={`/admin/exhibitions/${exhibition.id}`} />
          <div className={styles.fieldGrid}>
            <input type="hidden" name="section" value={exhibition.section ?? "GROUP"} />
            <div className={styles.field}>
              <label htmlFor="titleRu">Title RU</label>
              <input id="titleRu" name="titleRu" defaultValue={exhibition.titleRu ?? exhibition.title} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="titleEn">Title EN</label>
              <input id="titleEn" name="titleEn" defaultValue={exhibition.titleEn ?? exhibition.title} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="slug">Slug</label>
              <input id="slug" name="slug" defaultValue={exhibition.slug} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="venue">Venue / source</label>
              <input id="venue" name="venue" defaultValue={exhibition.venue} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="city">City</label>
              <input id="city" name="city" defaultValue={exhibition.city ?? ""} />
            </div>
            <div className={styles.field}>
              <label htmlFor="country">Country</label>
              <input id="country" name="country" defaultValue={exhibition.country ?? ""} />
            </div>
            <div className={styles.field}>
              <label htmlFor="categoryId">Exhibition category</label>
              <select id="categoryId" name="categoryId" defaultValue={exhibition.categoryId ?? ""} required>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.titleRu ?? category.title}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="sourceUrl">Source URL</label>
              <input id="sourceUrl" name="sourceUrl" type="url" defaultValue={exhibition.sourceUrl ?? ""} placeholder="https://..." />
            </div>
            <div className={styles.field}>
              <label htmlFor="sortOrder">Sort order</label>
              <input id="sortOrder" name="sortOrder" type="number" min="0" defaultValue={exhibition.sortOrder} />
            </div>
            <div className={styles.field}>
              <label htmlFor="startDate">Start date</label>
              <input id="startDate" name="startDate" type="date" defaultValue={toDateInputValue(exhibition.startDate)} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="endDate">End date</label>
              <input id="endDate" name="endDate" type="date" defaultValue={toDateInputValue(exhibition.endDate)} />
            </div>
          </div>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label htmlFor="descriptionRu">Description RU</label>
              <textarea id="descriptionRu" name="descriptionRu" defaultValue={exhibition.descriptionRu ?? exhibition.description ?? ""} />
            </div>
            <div className={styles.field}>
              <label htmlFor="descriptionEn">Description EN</label>
              <textarea id="descriptionEn" name="descriptionEn" defaultValue={exhibition.descriptionEn ?? exhibition.description ?? ""} />
            </div>
          </div>
          <div className={styles.checkboxRow}>
            <label className={styles.checkbox}>
              <input name="isPublished" type="checkbox" defaultChecked={exhibition.isPublished} />
              Published
            </label>
          </div>
          <button className={styles.submitButton} type="submit">
            Save exhibition
          </button>
        </form>
      </div>
    </section>
  );
}
