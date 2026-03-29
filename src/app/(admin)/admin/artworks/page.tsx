import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import type { ArtworkAdminListItem } from "@/features/artworks";
import { listAdminArtworks } from "@/features/artworks";
import { listAdminCategories } from "@/features/categories";
import { readAdminSession } from "@/server/auth";
import { shouldBypassImageOptimization } from "@/shared/lib/images";

import { createArtworkAction } from "../actions";
import styles from "../admin.module.css";
import { ArtworkCreateDialog } from "./ArtworkCreateDialog";
import { ArtworkEditorForm } from "./ArtworkEditorForm";
import { ArtworkMediaManager } from "./ArtworkMediaManager";

type ArtworksPageProps = {
  searchParams?: {
    created?: string;
    uploaded?: string;
    updated?: string;
    error?: string;
  };
};

export const dynamic = "force-dynamic";

function getArtworkPrimaryTitle(titleRu?: string, fallback?: string) {
  return titleRu ?? fallback ?? "Untitled";
}

function getArtworkMeta(artwork: ArtworkAdminListItem) {
  return [
    artwork.year ? String(artwork.year) : null,
    artwork.medium ?? null,
    artwork.dimensions ?? null,
  ]
    .filter(Boolean)
    .join(" • ");
}

export default async function AdminArtworksPage({
  searchParams,
}: ArtworksPageProps) {
  const session = await readAdminSession();
  if (!session) {
    redirect("/admin/login?next=/admin/artworks");
  }
  const [artworks, categories] = await Promise.all([
    listAdminArtworks(),
    listAdminCategories({ visibleOnly: false }),
  ]);

  return (
    <section className={styles.entityGrid}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Artworks</p>
        <h1 className={styles.panelTitle}>Artwork catalog</h1>
        <p className={styles.muted}>
          Create the artwork record first, then upload images in the Media column or on the Edit page, choose the cover, and manage the gallery order.
        </p>
        <ArtworkCreateDialog>
          <ArtworkEditorForm
            action={createArtworkAction}
            categories={categories}
            relatedArtworks={artworks}
            submitLabel="Create artwork"
            returnTo="/admin/artworks"
          />
        </ArtworkCreateDialog>
        {searchParams?.created ? (
          <p className={styles.notice}>Artwork created.</p>
        ) : null}
        {searchParams?.uploaded ? (
          <p className={styles.notice}>Image uploaded.</p>
        ) : null}
        {searchParams?.updated ? (
          <p className={styles.notice}>Artwork media updated.</p>
        ) : null}
        {searchParams?.error ? (
          <p className={styles.error}>{decodeURIComponent(searchParams.error)}</p>
        ) : null}
        <p className={styles.helper}>
          The image upload field appears after creation in the Media column and on the edit page, where media processing is attached to a stable artwork record.
        </p>
      </div>

      <div className={styles.listCard}>
        <h2 className={styles.listTitle}>Existing artworks</h2>
        {artworks.length === 0 ? (
          <p className={styles.empty}>No artworks yet.</p>
        ) : (
          <div className={styles.artworkAdminList}>
            {artworks.map((artwork) => {
              const title = getArtworkPrimaryTitle(artwork.titleRu, artwork.title);
              const secondaryTitle = artwork.titleEn && artwork.titleEn !== title ? artwork.titleEn : null;
              const meta = getArtworkMeta(artwork);
              const categoriesLabel = artwork.categories.map((item) => item.title).join(", ");

              return (
                <article key={artwork.id} className={styles.artworkAdminCard}>
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
                  </div>

                  <div className={styles.artworkAdminBody}>
                    <div className={styles.artworkAdminHeading}>
                      <div>
                        <p className={styles.eyebrow}>Artwork</p>
                        <h3 className={styles.artworkAdminTitle}>
                          <Link className={styles.entityLink} href={`/admin/artworks/${artwork.id}`}>
                            {title}
                          </Link>
                        </h3>
                        {secondaryTitle ? (
                          <p className={styles.artworkAdminSubtitle}>{secondaryTitle}</p>
                        ) : null}
                      </div>
                      <div className={styles.artworkAdminPills}>
                        <span className={styles.statusPill}>{artwork.status}</span>
                        <span className={styles.metaPill}>
                          {artwork.isPublished ? "Published" : "Draft"}
                        </span>
                        {artwork.isFeatured ? (
                          <span className={styles.metaPill}>Featured</span>
                        ) : null}
                      </div>
                    </div>

                    {meta ? <p className={styles.artworkAdminMeta}>{meta}</p> : null}

                    <dl className={styles.artworkAdminFacts}>
                      <div>
                        <dt>Categories</dt>
                        <dd>{categoriesLabel || "—"}</dd>
                      </div>
                      <div>
                        <dt>Images</dt>
                        <dd>{artwork.images.length}</dd>
                      </div>
                      <div>
                        <dt>Price</dt>
                        <dd>{artwork.priceOnRequest ? "On request" : "Visible"}</dd>
                      </div>
                      <div>
                        <dt>Updated</dt>
                        <dd>{new Date(artwork.updatedAt).toLocaleDateString("ru-RU")}</dd>
                      </div>
                    </dl>

                    <div className={styles.artworkAdminActions}>
                      <Link className={styles.primaryLinkButton} href={`/admin/artworks/${artwork.id}`}>
                        Edit artwork
                      </Link>
                      <a className={styles.secondaryLinkButton} href={`/ru/gallery/${artwork.slug}`} target="_blank" rel="noreferrer">
                        Open public page
                      </a>
                    </div>

                    <div className={styles.artworkAdminMediaPanel}>
                      <p className={styles.helper}>
                        Upload and reorder images directly here, or open the edit page for the full artwork form.
                      </p>
                      <ArtworkMediaManager artwork={artwork} returnTo="/admin/artworks" />
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
