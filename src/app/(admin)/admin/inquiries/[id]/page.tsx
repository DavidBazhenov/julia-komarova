import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getInquiryById } from "@/features/inquiries";
import { readAdminSession } from "@/server/auth";

import { updateInquiryStatusAction } from "../../actions";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminInquiryDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { updated?: string; error?: string; returnTo?: string };
}) {
  const session = await readAdminSession();
  if (!session) {
    redirect(`/admin/login?next=/admin/inquiries/${params.id}`);
  }

  const inquiry = await getInquiryById(params.id);
  if (!inquiry) {
    notFound();
  }

  const returnTo =
    searchParams?.returnTo && searchParams.returnTo.startsWith("/admin")
      ? searchParams.returnTo
      : inquiry.status === "ARCHIVED"
        ? "/admin/inquiries"
        : "/admin";

  return (
    <section className={styles.entityGrid}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Inquiries</p>
        <h1 className={styles.panelTitle}>Inquiry detail</h1>
        <p className={styles.helper}>
          <Link href={returnTo} className={styles.entityLink}>
            {returnTo === "/admin/inquiries" ? "Back to archive" : "Back to dashboard"}
          </Link>
        </p>
        {searchParams?.updated ? <p className={styles.notice}>Inquiry updated.</p> : null}
        {searchParams?.error ? (
          <p className={styles.error}>{decodeURIComponent(searchParams.error)}</p>
        ) : null}
        <dl className={styles.metaList}>
          <div>
            <dt>Name</dt>
            <dd>{inquiry.name}</dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>{inquiry.contact}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{inquiry.status}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{new Date(inquiry.createdAt).toLocaleString("en-GB")}</dd>
          </div>
          <div>
            <dt>Artwork</dt>
            <dd>{inquiry.artworkTitle ?? "General inquiry"}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{inquiry.source ?? "—"}</dd>
          </div>
        </dl>
        <div className={styles.field}>
          <label>Message</label>
          <div className={styles.messageCard}>{inquiry.message}</div>
        </div>
        <div className={styles.rowActions}>
          {["NEW", "READ", "ARCHIVED"].map((status) => (
            <form key={status} action={updateInquiryStatusAction}>
              <input type="hidden" name="inquiryId" value={inquiry.id} />
              <input type="hidden" name="status" value={status} />
              <input type="hidden" name="returnTo" value={status === "ARCHIVED" ? "/admin/inquiries" : `/admin/inquiries/${inquiry.id}?returnTo=${encodeURIComponent(returnTo)}`} />
              <button className={styles.miniButton} type="submit" disabled={status === inquiry.status}>
                {status}
              </button>
            </form>
          ))}
        </div>
      </div>
    </section>
  );
}
