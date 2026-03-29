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
  return (
    <div className={styles.mediaCell}>
      {artwork.images.length > 0 ? (
        <div className={styles.imageStrip}>
          {artwork.images.map((image) => (
            <div key={image.id} className={styles.thumbCard}>
              <Image
                src={image.thumbnailUrl}
                alt={image.alt || artwork.title}
                className={styles.thumbImage}
                width={88}
                height={88}
                unoptimized={shouldBypassImageOptimization(image.thumbnailUrl)}
              />
              <span className={styles.helper}>
                {image.isPrimary ? "Primary" : "Gallery"}
              </span>
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
                <form action={reorderArtworkImageAction}>
                  <input type="hidden" name="artworkId" value={artwork.id} />
                  <input type="hidden" name="imageId" value={image.id} />
                  <input type="hidden" name="slug" value={artwork.slug} />
                  <input type="hidden" name="direction" value="left" />
                  {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                  <button className={styles.miniButton} type="submit">
                    Move earlier
                  </button>
                </form>
                <form action={reorderArtworkImageAction}>
                  <input type="hidden" name="artworkId" value={artwork.id} />
                  <input type="hidden" name="imageId" value={image.id} />
                  <input type="hidden" name="slug" value={artwork.slug} />
                  <input type="hidden" name="direction" value="right" />
                  {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                  <button className={styles.miniButton} type="submit">
                    Move later
                  </button>
                </form>
                <form action={deleteArtworkImageAction}>
                  <input type="hidden" name="artworkId" value={artwork.id} />
                  <input type="hidden" name="imageId" value={image.id} />
                  <input type="hidden" name="slug" value={artwork.slug} />
                  {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                  <button className={styles.dangerButton} type="submit">
                    Remove image
                  </button>
                </form>
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
            accept="image/*,.cr3,.cr2,.nef,.arw,.dng,.raf,.orf,.rw2"
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`alt-${artwork.id}`}>Alt text</label>
          <input id={`alt-${artwork.id}`} name="alt" />
        </div>
        <p className={styles.fieldHint}>
          JPEG, PNG, WebP and RAW files including CR3 are supported. Upload size limit is 25 MB.
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
