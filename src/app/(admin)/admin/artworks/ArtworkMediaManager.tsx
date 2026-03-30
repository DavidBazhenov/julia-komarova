import Image from "next/image";

import type { ArtworkAdminListItem } from "@/features/artworks";
import { shouldBypassImageOptimization } from "@/shared/lib/images";

import {
  deleteArtworkImageAction,
  reorderArtworkImageAction,
  setPrimaryArtworkImageAction,
  uploadArtworkImageAction,
} from "../actions";
import styles from "../admin.module.css";
import { UploadSubmitButton } from "./UploadSubmitButton";

type ArtworkMediaManagerProps = {
  artwork: ArtworkAdminListItem;
  returnTo?: string;
};

export function ArtworkMediaManager({ artwork, returnTo }: ArtworkMediaManagerProps) {
  const hasMultipleImages = artwork.images.length > 1;

  return (
    <div className={styles.mediaCell}>
      {artwork.images.length > 0 ? (
        <div className={styles.imageStrip}>
          {artwork.images.map((image) => (
            <div key={image.id} className={styles.thumbCard}>
              <div className={styles.thumbImageWrap}>
                <Image
                  src={image.thumbnailUrl}
                  alt={image.alt || artwork.title}
                  className={styles.thumbImage}
                  width={176}
                  height={176}
                  unoptimized={shouldBypassImageOptimization(image.thumbnailUrl)}
                />
                <form action={deleteArtworkImageAction} className={styles.thumbDeleteForm}>
                  <input type="hidden" name="artworkId" value={artwork.id} />
                  <input type="hidden" name="imageId" value={image.id} />
                  <input type="hidden" name="slug" value={artwork.slug} />
                  {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                  <button className={styles.thumbDeleteButton} type="submit" aria-label="Remove image">
                    <span aria-hidden="true">🗑</span>
                  </button>
                </form>
              </div>
              <div className={styles.thumbActions}>
                {!image.isPrimary ? (
                  <form action={setPrimaryArtworkImageAction}>
                    <input type="hidden" name="artworkId" value={artwork.id} />
                    <input type="hidden" name="imageId" value={image.id} />
                    <input type="hidden" name="slug" value={artwork.slug} />
                    {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                    <button className={styles.miniButton} type="submit">
                      Set cover
                    </button>
                  </form>
                ) : null}
                {hasMultipleImages ? (
                  <>
                    <form action={reorderArtworkImageAction}>
                      <input type="hidden" name="artworkId" value={artwork.id} />
                      <input type="hidden" name="imageId" value={image.id} />
                      <input type="hidden" name="slug" value={artwork.slug} />
                      <input type="hidden" name="direction" value="left" />
                      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                      <button className={styles.iconButton} type="submit" aria-label="Move earlier">
                        <span aria-hidden="true">‹</span>
                      </button>
                    </form>
                    <form action={reorderArtworkImageAction}>
                      <input type="hidden" name="artworkId" value={artwork.id} />
                      <input type="hidden" name="imageId" value={image.id} />
                      <input type="hidden" name="slug" value={artwork.slug} />
                      <input type="hidden" name="direction" value="right" />
                      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                      <button className={styles.iconButton} type="submit" aria-label="Move later">
                        <span aria-hidden="true">›</span>
                      </button>
                    </form>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.helper}>No images yet.</p>
      )}

      <form action={uploadArtworkImageAction} className={styles.inlineUploadForm}>
        <input type="hidden" name="artworkId" value={artwork.id} />
        <input type="hidden" name="slug" value={artwork.slug} />
        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
        <div className={styles.field}>
          <label htmlFor={`image-${artwork.id}`}>Image</label>
          <input
            id={`image-${artwork.id}`}
            name="image"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`alt-${artwork.id}`}>Alt text</label>
          <input id={`alt-${artwork.id}`} name="alt" />
        </div>
        <p className={styles.fieldHint}>
          Supported formats: JPG, PNG, WebP. Upload size limit is 25 MB.
        </p>
        <label className={styles.checkbox}>
          <input name="markAsPrimary" type="checkbox" />
          Set as primary
        </label>
        <UploadSubmitButton idleLabel="Upload" pendingLabel="Uploading..." />
      </form>
    </div>
  );
}
