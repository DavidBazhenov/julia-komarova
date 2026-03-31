import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { listAdminArtworks } from "@/features/artworks";
import { getArtworkAdminById } from "@/features/artworks/admin";
import { listAdminCategories } from "@/features/categories";
import { readAdminSession } from "@/server/auth";

import { deleteArtworkAction, updateArtworkAction } from "../../actions";
import styles from "../../admin.module.css";
import { ArtworkEditorForm } from "../ArtworkEditorForm";
import { ArtworkMediaManager } from "../ArtworkMediaManager";

type ArtworkEditPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    updated?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminArtworkEditPage({
  params,
  searchParams,
}: ArtworkEditPageProps) {
  const { id } = await params;
  const session = await readAdminSession();
  if (!session) {
    redirect(`/admin/login?next=/admin/artworks/${id}`);
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [artwork, categories, relatedArtworks] = await Promise.all([
    getArtworkAdminById(id),
    listAdminCategories({ visibleOnly: false }),
    listAdminArtworks({ publishedOnly: false }),
  ]);

  if (!artwork) {
    notFound();
  }

  return (
    <section className={`${styles.entityGrid} ${styles.artworkEditPage}`}>
      <div className={`${styles.panel} ${styles.artworkEditPanel}`}>
        <div className={styles.artworkEditLead}>
          <p className={styles.eyebrow}>Artworks</p>
          <h1 className={styles.panelTitle}>Edit artwork</h1>
          <p className={styles.muted}>Update the artwork metadata and manage its gallery in one workspace.</p>
          <Link className={styles.artworkEditBackLink} href="/admin/artworks">
            Back to artworks
          </Link>
        </div>
        {resolvedSearchParams?.updated ? (
          <p className={styles.notice}>Artwork saved.</p>
        ) : null}
        {resolvedSearchParams?.error ? (
          <p className={styles.error}>{decodeURIComponent(resolvedSearchParams.error)}</p>
        ) : null}
        <div className={styles.artworkEditSections}>
          <div className={styles.artworkEditSection}>
            <div className={styles.formSectionHeader}>
              <h2 className={styles.formSectionTitle}>Artwork images</h2>
              <p className={styles.formSectionHint}>
                Upload variants, set the primary image, and reorder the gallery sequence.
              </p>
            </div>
            <ArtworkMediaManager artwork={artwork} returnTo={`/admin/artworks/${artwork.id}`} />
          </div>
          <div className={styles.artworkEditSection}>
            <ArtworkEditorForm
              action={updateArtworkAction}
              artwork={artwork}
              categories={categories}
              relatedArtworks={relatedArtworks}
              submitLabel="Save artwork"
              returnTo={`/admin/artworks/${artwork.id}`}
            />
            <form action={deleteArtworkAction} className={styles.form}>
              <input type="hidden" name="artworkId" value={artwork.id} />
              <input type="hidden" name="returnTo" value={`/admin/artworks/${artwork.id}`} />
              <button className={styles.dangerButton} type="submit">
                Delete artwork
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
