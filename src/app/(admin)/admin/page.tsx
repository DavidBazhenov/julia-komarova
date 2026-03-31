import Link from "next/link";
import { redirect } from "next/navigation";

import {
  getArtworkAdminSummary,
  getCategoryAdminSummary,
  getExhibitionAdminSummary,
  listInquiries,
} from "@/features";
import type { InquiryListItem } from "@/features";
import { readAdminSession } from "@/server/auth";
import { getStorageUsageSummary } from "@/server/system";

import { updateInquiryStatusAction } from "./actions";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await readAdminSession();
  if (!session) {
    redirect("/admin/login?next=/admin");
  }

  let inquiries: InquiryListItem[] = [];
  let inquiryServiceConnected = true;
  const [artworks, categories, exhibitions, storage] = await Promise.all([
    getArtworkAdminSummary(),
    getCategoryAdminSummary(),
    getExhibitionAdminSummary(),
    getStorageUsageSummary(),
  ]);

  try {
    inquiries = (await listInquiries({ limit: 50 }))
      .filter((item) => item.status !== "ARCHIVED")
      .slice(0, 12);
  } catch {
    inquiryServiceConnected = false;
  }

  function formatBytes(bytes: number): string {
    if (bytes <= 0) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB"];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** exponent;
    return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
  }

  const storageUsedPercent = storage ? Math.max(0, Math.min(100, 100 - storage.freePercent)) : 0;

  return (
    <>
      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Artworks</span>
          <strong className={styles.summaryValue}>{artworks.total}</strong>
          <p className={styles.muted}>
            {artworks.published} published, {artworks.featured} featured
          </p>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Categories</span>
          <strong className={styles.summaryValue}>{categories.total}</strong>
          <p className={styles.muted}>
            {categories.visible} visible, {categories.hidden} hidden
          </p>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Exhibitions</span>
          <strong className={styles.summaryValue}>{exhibitions.total}</strong>
          <p className={styles.muted}>
            {exhibitions.published} published, {exhibitions.upcoming} upcoming
          </p>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Availability</span>
          <strong className={styles.summaryValue}>{artworks.available}</strong>
          <p className={styles.muted}>
            {artworks.sold} sold, {artworks.reserved} reserved
          </p>
        </article>
        <article className={`${styles.summaryCard} ${styles.summaryCardStorage}`}>
          <span className={styles.summaryLabel}>Storage</span>
          <strong className={styles.summaryValue}>
            {storage ? formatBytes(storage.freeBytes) : "—"}
          </strong>
          <p className={styles.muted}>
            {storage ? `из ${formatBytes(storage.totalBytes)}` : "Storage metrics are unavailable."}
          </p>
          {storage ? (
            <div
              className={styles.storageBar}
              role="progressbar"
              aria-label="Used storage"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(storageUsedPercent)}
            >
              <div
                className={styles.storageBarFill}
                style={{ width: `${storageUsedPercent}%` }}
              />
            </div>
          ) : null}
        </article>
      </section>

      <section className={styles.content}>
        <div className={styles.listCard}>
          <div className={styles.listCardHeader}>
            <h2 className={styles.listTitle}>Incoming messages</h2>
            <Link className={styles.entityLink} href="/admin/inquiries">
              View archive
            </Link>
          </div>
          {!inquiryServiceConnected ? (
            <p className={styles.notice}>
              Inquiry service is temporarily unavailable.
            </p>
          ) : null}
          {inquiries.length === 0 ? (
            <p className={styles.empty}>No messages yet.</p>
          ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Message</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>
                    <Link className={styles.entityLink} href={`/admin/inquiries/${item.id}`}>
                      {item.contact}
                    </Link>
                  </td>
                  <td>
                    <strong>{item.artworkTitle ?? "General"}</strong>
                    <p className={styles.tableNote}>{item.message}</p>
                  </td>
                  <td>{item.status}</td>
                  <td>{new Date(item.createdAt).toLocaleString("en-GB")}</td>
                  <td>
                    <div className={styles.rowActions}>
                      {item.status !== "NEW" ? (
                        <form action={updateInquiryStatusAction}>
                          <input type="hidden" name="inquiryId" value={item.id} />
                          <input type="hidden" name="status" value="NEW" />
                          <input type="hidden" name="returnTo" value="/admin" />
                          <button className={styles.miniButton} type="submit">
                            Mark new
                          </button>
                        </form>
                      ) : null}
                      {item.status !== "READ" ? (
                        <form action={updateInquiryStatusAction}>
                          <input type="hidden" name="inquiryId" value={item.id} />
                          <input type="hidden" name="status" value="READ" />
                          <input type="hidden" name="returnTo" value="/admin" />
                          <button className={styles.miniButton} type="submit">
                            Mark read
                          </button>
                        </form>
                      ) : null}
                      {item.status !== "ARCHIVED" ? (
                        <form action={updateInquiryStatusAction}>
                          <input type="hidden" name="inquiryId" value={item.id} />
                          <input type="hidden" name="status" value="ARCHIVED" />
                          <input type="hidden" name="returnTo" value="/admin/inquiries" />
                          <button className={styles.miniButton} type="submit">
                            Archive
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </section>
    </>
  );
}
