import type { ArtworkAdminListItem } from "@/features/artworks";
import type { CategoryListItem } from "@/features/categories";

import { artworkStatuses } from "@/features/artworks";

import styles from "../admin.module.css";

type ArtworkEditorFormProps = {
  action: (formData: FormData) => Promise<void>;
  artwork?: ArtworkAdminListItem | null;
  categories: CategoryListItem[];
  relatedArtworks: ArtworkAdminListItem[];
  submitLabel: string;
  returnTo?: string;
};

function getArtworkTitle(artwork: ArtworkAdminListItem): string {
  return artwork.titleRu ?? artwork.title;
}

export function ArtworkEditorForm({
  action,
  artwork,
  categories,
  relatedArtworks,
  submitLabel,
  returnTo,
}: ArtworkEditorFormProps) {
  const categoryIds = artwork?.categories.map((category) => category.id) ?? [];
  const relatedArtworkIds = artwork?.relatedArtworkIds ?? [];
  const relatedOptions = relatedArtworks.filter((item) => item.id !== artwork?.id);

  return (
    <form action={action} className={`${styles.form} ${styles.artworkEditorForm}`}>
      {artwork ? <input type="hidden" name="artworkId" value={artwork.id} /> : null}
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

      <section className={styles.formSection}>
        <div className={styles.formSectionHeader}>
          <h2 className={styles.formSectionTitle}>Core details</h2>
          <p className={styles.formSectionHint}>
            Localized names, public metadata, and the core inventory fields for the artwork card.
          </p>
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="titleRu">Title RU</label>
            <input id="titleRu" name="titleRu" defaultValue={artwork?.titleRu ?? artwork?.title ?? ""} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="titleEn">Title EN</label>
            <input id="titleEn" name="titleEn" defaultValue={artwork?.titleEn ?? artwork?.title ?? ""} required />
          </div>
        </div>

        <div className={`${styles.fieldGrid} ${styles.fieldGridTriple}`}>
          <div className={styles.field}>
            <label htmlFor="slug">Slug</label>
            <input id="slug" name="slug" defaultValue={artwork?.slug ?? ""} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="year">Year</label>
            <input id="year" name="year" type="number" min="1000" max="9999" defaultValue={artwork?.year ?? ""} />
          </div>
          <div className={styles.field}>
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={artwork?.status ?? "AVAILABLE"}>
              {artworkStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="mediumRu">Medium RU</label>
            <input id="mediumRu" name="mediumRu" defaultValue={artwork?.mediumRu ?? artwork?.medium ?? ""} />
            <p className={styles.fieldHint}>Техника и материалы, например: Смешанная техника.</p>
          </div>
          <div className={styles.field}>
            <label htmlFor="mediumEn">Medium EN</label>
            <input id="mediumEn" name="mediumEn" defaultValue={artwork?.mediumEn ?? artwork?.medium ?? ""} />
            <p className={styles.fieldHint}>Technique and materials, for example: Oil on canvas.</p>
          </div>
        </div>

        <div className={`${styles.fieldGrid} ${styles.fieldGridTriple}`}>
          <div className={styles.field}>
            <label htmlFor="dimensions">Dimensions</label>
            <input id="dimensions" name="dimensions" defaultValue={artwork?.dimensions ?? ""} />
            <p className={styles.fieldHint}>Public display size, for example: 80 × 120 cm.</p>
          </div>
          <div className={styles.field}>
            <label htmlFor="sortOrder">Sort order</label>
            <input id="sortOrder" name="sortOrder" type="number" min="0" defaultValue={artwork?.sortOrder ?? 0} />
          </div>
          <div className={styles.field}>
            <label htmlFor="price">Price</label>
            <input id="price" name="price" defaultValue={artwork?.price ?? ""} />
            <p className={styles.fieldHint}>For example: 120 000 ₽ or $1,800.</p>
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.formSectionHeader}>
          <h2 className={styles.formSectionTitle}>Descriptions</h2>
          <p className={styles.formSectionHint}>
            Keep the public story of the artwork aligned in both languages.
          </p>
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="descriptionRu">Description RU</label>
            <textarea id="descriptionRu" name="descriptionRu" defaultValue={artwork?.descriptionRu ?? artwork?.description ?? ""} />
          </div>
          <div className={styles.field}>
            <label htmlFor="descriptionEn">Description EN</label>
            <textarea id="descriptionEn" name="descriptionEn" defaultValue={artwork?.descriptionEn ?? artwork?.description ?? ""} />
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.formSectionHeader}>
          <h2 className={styles.formSectionTitle}>Relationships</h2>
          <p className={styles.formSectionHint}>
            Control how the artwork is grouped in the gallery and what related works appear on the public page.
          </p>
        </div>

        <div className={styles.relationshipGrid}>
          <div className={styles.field}>
            <label>Categories</label>
            <details className={styles.multiSelect}>
              <summary>
                {categoryIds.length > 0
                  ? `${categoryIds.length} selected`
                  : "Choose one or more categories"}
              </summary>
              <div className={styles.multiSelectPanel}>
                <div className={styles.optionGrid}>
                  {categories.map((category) => (
                    <label key={category.id} className={styles.optionCard}>
                      <input
                        name="categoryIds"
                        type="checkbox"
                        value={category.id}
                        defaultChecked={categoryIds.includes(category.id)}
                      />
                      <span className={styles.optionCardTitle}>{category.title}</span>
                      {category.description ? (
                        <span className={styles.optionCardMeta}>{category.description}</span>
                      ) : null}
                    </label>
                  ))}
                </div>
              </div>
            </details>
            <p className={styles.fieldHint}>You can select several categories for one artwork.</p>
          </div>

          <div className={styles.field}>
            <label>Related artworks</label>
            {relatedOptions.length === 0 ? (
              <p className={styles.fieldHint}>Create more artworks to link related works.</p>
            ) : (
              <details className={styles.multiSelect}>
                <summary>
                  {relatedArtworkIds.length > 0
                    ? `${relatedArtworkIds.length} selected`
                    : "Choose related artworks"}
                </summary>
                <div className={styles.multiSelectPanel}>
                  <div className={styles.optionGrid}>
                    {relatedOptions.map((item) => (
                      <label key={item.id} className={styles.optionCard}>
                        <input
                          name="relatedArtworkIds"
                          type="checkbox"
                          value={item.id}
                          defaultChecked={relatedArtworkIds.includes(item.id)}
                        />
                        <span className={styles.optionCardTitle}>{getArtworkTitle(item)}</span>
                        <span className={styles.optionCardMeta}>
                          {item.year ? `${item.year} • ` : ""}
                          {item.status}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </details>
            )}
            <p className={styles.fieldHint}>Selected works will appear in the related artworks block on the artwork page.</p>
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.formSectionHeader}>
          <h2 className={styles.formSectionTitle}>SEO</h2>
          <p className={styles.formSectionHint}>
            Fill localized metadata for search previews when the artwork is indexed.
          </p>
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="seoTitleRu">SEO title RU</label>
            <input id="seoTitleRu" name="seoTitleRu" defaultValue={artwork?.seoTitleRu ?? artwork?.seoTitle ?? ""} />
          </div>
          <div className={styles.field}>
            <label htmlFor="seoTitleEn">SEO title EN</label>
            <input id="seoTitleEn" name="seoTitleEn" defaultValue={artwork?.seoTitleEn ?? artwork?.seoTitle ?? ""} />
          </div>
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="seoDescriptionRu">SEO description RU</label>
            <textarea id="seoDescriptionRu" name="seoDescriptionRu" defaultValue={artwork?.seoDescriptionRu ?? artwork?.seoDescription ?? ""} />
          </div>
          <div className={styles.field}>
            <label htmlFor="seoDescriptionEn">SEO description EN</label>
            <textarea id="seoDescriptionEn" name="seoDescriptionEn" defaultValue={artwork?.seoDescriptionEn ?? artwork?.seoDescription ?? ""} />
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.formSectionHeader}>
          <h2 className={styles.formSectionTitle}>Visibility</h2>
          <p className={styles.formSectionHint}>
            Control homepage promotion and whether the artwork is visible on the public website.
          </p>
        </div>

        <div className={styles.checkboxGrid}>
          <div className={styles.checkboxCard}>
            <label className={styles.checkbox}>
              <input name="isFeatured" type="checkbox" defaultChecked={artwork?.isFeatured ?? false} />
              Featured
            </label>
            <p className={styles.fieldHint}>Show this artwork in highlighted homepage and landing selections. It appears publicly only if Published is also enabled.</p>
          </div>
          <div className={styles.checkboxCard}>
            <label className={styles.checkbox}>
              <input name="isPublished" type="checkbox" defaultChecked={artwork?.isPublished ?? false} />
              Published
            </label>
            <p className={styles.fieldHint}>Only published artworks are visible on the public website.</p>
          </div>
        </div>
      </section>

      <button className={styles.submitButton} type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
