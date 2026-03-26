import Link from "next/link";
import { redirect } from "next/navigation";

import { listAdminExhibitions } from "@/features/exhibitions";
import { listAdminExhibitionCategories } from "@/features/exhibition-categories";
import { readAdminSession } from "@/server/auth";

import { createExhibitionAction } from "../actions";
import styles from "../admin.module.css";

type ExhibitionsPageProps = {
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminExhibitionsPage({
  searchParams,
}: ExhibitionsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const session = await readAdminSession();
  if (!session) {
    redirect("/admin/login?next=/admin/exhibitions");
  }
  const exhibitions = await listAdminExhibitions();
  const categories = await listAdminExhibitionCategories({ visibleOnly: false });

  return (
    <section className={styles.entityGrid}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Exhibitions</p>
        <h1 className={styles.panelTitle}>Create exhibition</h1>
        <p className={styles.muted}>
          Publish exhibition references with source links and assign them to exhibition categories.
        </p>
        <p className={styles.helper}>
          <Link href="/admin/exhibition-categories" className={styles.entityLink}>
            Manage exhibition categories
          </Link>
        </p>
        {resolvedSearchParams?.created ? (
          <p className={styles.notice}>Exhibition created.</p>
        ) : null}
        {resolvedSearchParams?.updated ? (
          <p className={styles.notice}>Exhibition updated.</p>
        ) : null}
        {resolvedSearchParams?.error ? (
          <p className={styles.error}>{decodeURIComponent(resolvedSearchParams.error)}</p>
        ) : null}
        <form action={createExhibitionAction} className={styles.form}>
          <div className={styles.fieldGrid}>
            <input type="hidden" name="section" value="GROUP" />
            <div className={styles.field}>
              <label htmlFor="titleRu">Title RU</label>
              <input id="titleRu" name="titleRu" required />
            </div>
            <div className={styles.field}>
              <label htmlFor="titleEn">Title EN</label>
              <input id="titleEn" name="titleEn" required />
            </div>
            <div className={styles.field}>
              <label htmlFor="slug">Slug</label>
              <input id="slug" name="slug" required />
            </div>
            <div className={styles.field}>
              <label htmlFor="venue">Venue / source</label>
              <input id="venue" name="venue" required />
            </div>
            <div className={styles.field}>
              <label htmlFor="city">City</label>
              <input id="city" name="city" />
            </div>
            <div className={styles.field}>
              <label htmlFor="country">Country</label>
              <input id="country" name="country" />
            </div>
            <div className={styles.field}>
              <label htmlFor="categoryId">Exhibition category</label>
              <select id="categoryId" name="categoryId" required>
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
              <input id="sourceUrl" name="sourceUrl" type="url" placeholder="https://..." />
            </div>
            <div className={styles.field}>
              <label htmlFor="sortOrder">Sort order</label>
              <input id="sortOrder" name="sortOrder" type="number" min="0" defaultValue="0" />
            </div>
            <div className={styles.field}>
              <label htmlFor="startDate">Start date</label>
              <input id="startDate" name="startDate" type="date" required />
            </div>
            <div className={styles.field}>
              <label htmlFor="endDate">End date</label>
              <input id="endDate" name="endDate" type="date" />
            </div>
          </div>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label htmlFor="descriptionRu">Description RU</label>
              <textarea id="descriptionRu" name="descriptionRu" />
            </div>
            <div className={styles.field}>
              <label htmlFor="descriptionEn">Description EN</label>
              <textarea id="descriptionEn" name="descriptionEn" />
            </div>
          </div>
          <div className={styles.checkboxRow}>
            <label className={styles.checkbox}>
              <input name="isPublished" type="checkbox" />
              Published
            </label>
          </div>
          <button className={styles.submitButton} type="submit">
            Create exhibition
          </button>
        </form>
      </div>

      <div className={styles.listCard}>
        <h2 className={styles.listTitle}>Existing exhibitions</h2>
        {exhibitions.length === 0 ? (
          <p className={styles.empty}>No exhibitions yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Title</th>
                <th>Venue</th>
                <th>Start</th>
                <th>Published</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {exhibitions.map((item) => (
                <tr key={item.id}>
                  <td>{item.category?.title ?? "—"}</td>
                  <td>
                    <strong>
                      <Link className={styles.entityLink} href={`/admin/exhibitions/${item.id}`}>
                        {item.titleRu ?? item.title}
                      </Link>
                    </strong>
                    <br />
                    <span className={styles.muted}>{item.titleEn ?? "—"}</span>
                  </td>
                  <td>{item.venue}</td>
                  <td>{new Date(item.startDate).toLocaleDateString("en-GB")}</td>
                  <td>{item.isPublished ? "Yes" : "No"}</td>
                  <td>
                    <Link className={styles.entityLink} href={`/admin/exhibitions/${item.id}`}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
