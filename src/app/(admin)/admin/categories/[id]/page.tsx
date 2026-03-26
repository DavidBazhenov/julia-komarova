import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCategoryAdminById } from "@/features/categories";
import { readAdminSession } from "@/server/auth";

import { deleteCategoryAction, updateCategoryAction } from "../../actions";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminCategoryEditPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { updated?: string; error?: string };
}) {
  const session = await readAdminSession();
  if (!session) {
    redirect(`/admin/login?next=/admin/categories/${params.id}`);
  }

  const category = await getCategoryAdminById(params.id);
  if (!category) {
    notFound();
  }

  return (
    <section className={styles.entityGrid}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Categories</p>
        <h1 className={styles.panelTitle}>Edit category</h1>
        <p className={styles.helper}>
          <Link href="/admin/categories" className={styles.entityLink}>
            Back to categories
          </Link>
        </p>
        {searchParams?.updated ? <p className={styles.notice}>Category updated.</p> : null}
        {searchParams?.error ? (
          <p className={styles.error}>{decodeURIComponent(searchParams.error)}</p>
        ) : null}
        <form action={updateCategoryAction} className={styles.form}>
          <input type="hidden" name="categoryId" value={category.id} />
          <input type="hidden" name="returnTo" value={`/admin/categories/${category.id}`} />
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label htmlFor="titleRu">Title RU</label>
              <input id="titleRu" name="titleRu" defaultValue={category.titleRu ?? category.title} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="titleEn">Title EN</label>
              <input id="titleEn" name="titleEn" defaultValue={category.titleEn ?? category.title} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="slug">Slug</label>
              <input id="slug" name="slug" defaultValue={category.slug} required />
            </div>
          </div>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label htmlFor="descriptionRu">Description RU</label>
              <textarea id="descriptionRu" name="descriptionRu" defaultValue={category.descriptionRu ?? category.description ?? ""} />
            </div>
            <div className={styles.field}>
              <label htmlFor="descriptionEn">Description EN</label>
              <textarea id="descriptionEn" name="descriptionEn" defaultValue={category.descriptionEn ?? category.description ?? ""} />
            </div>
          </div>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label htmlFor="sortOrder">Sort order</label>
              <input id="sortOrder" name="sortOrder" type="number" min="0" defaultValue={category.sortOrder} />
            </div>
          </div>
          <div className={styles.checkboxRow}>
            <label className={styles.checkbox}>
              <input name="isVisible" type="checkbox" defaultChecked={category.isVisible} />
              Visible in public gallery
            </label>
          </div>
          <button className={styles.submitButton} type="submit">
            Save category
          </button>
        </form>
        <form action={deleteCategoryAction} className={styles.form}>
          <input type="hidden" name="categoryId" value={category.id} />
          <input type="hidden" name="returnTo" value={`/admin/categories/${category.id}`} />
          <button className={styles.dangerButton} type="submit">
            Delete category
          </button>
        </form>
      </div>
    </section>
  );
}
