import Link from "next/link";
import { redirect } from "next/navigation";

import { listAdminExhibitionCategories } from "@/features/exhibition-categories";
import { readAdminSession } from "@/server/auth";

import { createExhibitionCategoryAction, deleteExhibitionCategoryAction } from "../actions";
import styles from "../admin.module.css";

type ExhibitionCategoriesPageProps = {
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminExhibitionCategoriesPage({
  searchParams,
}: ExhibitionCategoriesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const session = await readAdminSession();
  if (!session) {
    redirect("/admin/login?next=/admin/exhibition-categories");
  }

  const categories = await listAdminExhibitionCategories();

  return (
    <section className={styles.entityGrid}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Exhibition categories</p>
        <h1 className={styles.panelTitle}>Create exhibition category</h1>
        <p className={styles.muted}>
          These categories define the sections and order on the public exhibitions page.
        </p>
        {resolvedSearchParams?.created ? <p className={styles.notice}>Exhibition category created.</p> : null}
        {resolvedSearchParams?.updated ? <p className={styles.notice}>Exhibition category updated.</p> : null}
        {resolvedSearchParams?.error ? (
          <p className={styles.error}>{decodeURIComponent(resolvedSearchParams.error)}</p>
        ) : null}
        <form action={createExhibitionCategoryAction} className={styles.form}>
          <div className={styles.fieldGrid}>
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
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label htmlFor="sortOrder">Sort order</label>
              <input id="sortOrder" name="sortOrder" type="number" min="0" defaultValue="0" />
            </div>
          </div>
          <div className={styles.checkboxRow}>
            <label className={styles.checkbox}>
              <input name="isVisible" type="checkbox" defaultChecked />
              Visible on public exhibitions page
            </label>
          </div>
          <button className={styles.submitButton} type="submit">
            Create exhibition category
          </button>
        </form>
      </div>

      <div className={styles.listCard}>
        <h2 className={styles.listTitle}>Existing exhibition categories</h2>
        {categories.length === 0 ? (
          <p className={styles.empty}>No exhibition categories yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Visible</th>
                <th>Sort</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <strong>
                      <Link className={styles.entityLink} href={`/admin/exhibition-categories/${category.id}`}>
                        {category.titleRu ?? category.title}
                      </Link>
                    </strong>
                    <br />
                    <span className={styles.muted}>{category.titleEn ?? "—"}</span>
                  </td>
                  <td>{category.slug}</td>
                  <td>{category.isVisible ? "Yes" : "No"}</td>
                  <td>{category.sortOrder}</td>
                  <td>
                    <div className={styles.thumbActions}>
                      <Link className={styles.entityLink} href={`/admin/exhibition-categories/${category.id}`}>
                        Edit
                      </Link>
                      <form action={deleteExhibitionCategoryAction}>
                        <input type="hidden" name="categoryId" value={category.id} />
                        <input type="hidden" name="returnTo" value="/admin/exhibition-categories" />
                        <button className={styles.dangerButton} type="submit">
                          Delete
                        </button>
                      </form>
                    </div>
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
