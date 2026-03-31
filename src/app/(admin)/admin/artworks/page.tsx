import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { listAdminArtworks } from "@/features/artworks";
import { listAdminCategories } from "@/features/categories";
import { readAdminSession } from "@/server/auth";
import { shouldBypassImageOptimization } from "@/shared/lib/images";

import { createArtworkAction } from "../actions";
import styles from "../admin.module.css";
import { ArtworkCreateDialog } from "./ArtworkCreateDialog";
import { ArtworkEditorForm } from "./ArtworkEditorForm";

type ArtworksPageProps = {
  searchParams?: Promise<{
    created?: string;
    deleted?: string;
    uploaded?: string;
    updated?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

function getArtworkPrimaryTitle(titleRu?: string, fallback?: string) {
  return titleRu ?? fallback ?? "Untitled";
}

export default async function AdminArtworksPage({
  searchParams,
}: ArtworksPageProps) {
  const session = await readAdminSession();
  if (!session) {
    redirect("/admin/login?next=/admin/artworks");
  }
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [artworks, categories] = await Promise.all([
    listAdminArtworks(),
    listAdminCategories({ visibleOnly: false }),
  ]);

  return (
    <section className={`${styles.entityGrid} ${styles.artworksPage}`}>
      <div className={styles.artworksToolbar}>
        <ArtworkCreateDialog>
          <ArtworkEditorForm
            action={createArtworkAction}
            categories={categories}
            relatedArtworks={artworks}
            submitLabel="Create artwork"
            returnTo="/admin/artworks"
          />
        </ArtworkCreateDialog>
      </div>

      {resolvedSearchParams?.created ? (
        <p className={styles.notice}>Artwork created.</p>
      ) : null}
      {resolvedSearchParams?.deleted ? (
        <p className={styles.notice}>Artwork deleted.</p>
      ) : null}
      {resolvedSearchParams?.uploaded ? (
        <p className={styles.notice}>Image uploaded.</p>
      ) : null}
      {resolvedSearchParams?.updated ? (
        <p className={styles.notice}>Artwork media updated.</p>
      ) : null}
      {resolvedSearchParams?.error ? (
        <p className={styles.error}>{decodeURIComponent(resolvedSearchParams.error)}</p>
      ) : null}

      <div className={styles.listCard}>
        <h2 className={styles.listTitle}>Existing artworks</h2>
        {artworks.length === 0 ? (
          <p className={styles.empty}>No artworks yet.</p>
        ) : (
          <div className={styles.artworkAdminList}>
            {artworks.map((artwork) => {
              const title = getArtworkPrimaryTitle(artwork.titleRu, artwork.title);

              return (
                <article key={artwork.id} className={styles.artworkAdminCard}>
                  <h3 className={styles.artworkAdminTitle}>
                    <Link className={styles.entityLink} href={`/admin/artworks/${artwork.id}`}>
                      {title}
                    </Link>
                  </h3>

                  <div className={styles.artworkAdminPreview}>
                    <div className={styles.artworkAdminThumbFrame}>
                      {artwork.coverImage ? (
                        <Image
                          src={artwork.coverImage.thumbnailUrl}
                          alt={artwork.coverImage.alt || title}
                          width={240}
                          height={240}
                          unoptimized={shouldBypassImageOptimization(artwork.coverImage.thumbnailUrl)}
                          className={styles.artworkAdminThumb}
                        />
                      ) : (
                        <div className={styles.artworkAdminThumbPlaceholder}>No image</div>
                      )}
                    </div>
                    <div className={styles.artworkAdminActions}>
                      <Link className={styles.primaryLinkButton} href={`/admin/artworks/${artwork.id}`}>
                        Edit artwork
                      </Link>
                      <a className={styles.secondaryLinkButton} href={`/ru/gallery/${artwork.slug}`} target="_blank" rel="noreferrer">
                        Open public page
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
