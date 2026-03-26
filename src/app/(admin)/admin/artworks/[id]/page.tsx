import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { listAdminArtworks } from "@/features/artworks";
import { getArtworkAdminById } from "@/features/artworks/admin";
import { listAdminCategories } from "@/features/categories";
import { readAdminSession } from "@/server/auth";

import { updateArtworkAction } from "../../actions";
import styles from "../../admin.module.css";
import { ArtworkEditorForm } from "../ArtworkEditorForm";
import { ArtworkMediaManager } from "../ArtworkMediaManager";

type ArtworkEditPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    updated?: string;
    error?: string;
  };
};

export const dynamic = "force-dynamic";

export default async function AdminArtworkEditPage({
  params,
  searchParams,
}: ArtworkEditPageProps) {
  const session = await readAdminSession();
  if (!session) {
    redirect(`/admin/login?next=/admin/artworks/${params.id}`);
  }

  const [artwork, categories, relatedArtworks] = await Promise.all([
    getArtworkAdminById(params.id),
    listAdminCategories({ visibleOnly: false }),
    listAdminArtworks({ publishedOnly: false }),
  ]);

  if (!artwork) {
    notFound();
  }

  return (
    <section className={styles.entityGrid}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Artworks</p>
        <h1 className={styles.panelTitle}>Edit artwork</h1>
        <p className={styles.muted}>
          Update the core artwork metadata. Media is managed in the adjacent section.
        </p>
        <p className={styles.helper}>
          <Link href="/admin/artworks">Back to artworks</Link>
        </p>
        {searchParams?.updated ? (
          <p className={styles.notice}>Artwork saved.</p>
        ) : null}
        {searchParams?.error ? (
          <p className={styles.error}>{decodeURIComponent(searchParams.error)}</p>
        ) : null}
        <ArtworkEditorForm
          action={updateArtworkAction}
          artwork={artwork}
          categories={categories}
          relatedArtworks={relatedArtworks}
          submitLabel="Save artwork"
          returnTo={`/admin/artworks/${artwork.id}`}
        />
      </div>

      <div className={styles.panel}>
        <p className={styles.eyebrow}>Media</p>
        <h2 className={styles.panelTitle}>Artwork images</h2>
        <p className={styles.muted}>
          Upload variants, set the primary image, and reorder the gallery sequence.
        </p>
        <ArtworkMediaManager artwork={artwork} returnTo={`/admin/artworks/${artwork.id}`} />
      </div>
    </section>
  );
}
