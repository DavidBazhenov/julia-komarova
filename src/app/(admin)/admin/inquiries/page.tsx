import Link from "next/link";
import { redirect } from "next/navigation";

import { listInquiries } from "@/features/inquiries";
import { readAdminSession } from "@/server/auth";

import { updateInquiryStatusAction } from "../actions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const session = await readAdminSession();
  if (!session) {
    redirect("/admin/login?next=/admin/inquiries");
  }

  const inquiries = await listInquiries({ status: "ARCHIVED", limit: 100 });

  return (
    <section className={styles.content}>
      <div className={styles.listCard}>
        <div className={styles.listCardHeader}>
          <div>
            <p className={styles.eyebrow}>Inquiries</p>
            <h1 className={styles.listTitle}>Archive</h1>
          </div>
          <Link className={styles.entityLink} href="/admin">
            Back to dashboard
          </Link>
        </div>

        {inquiries.length === 0 ? (
          <p className={styles.empty}>Archive is empty.</p>
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
                      <form action={updateInquiryStatusAction}>
                        <input type="hidden" name="inquiryId" value={item.id} />
                        <input type="hidden" name="status" value="NEW" />
                        <input type="hidden" name="returnTo" value="/admin/inquiries" />
                        <button className={styles.miniButton} type="submit">
                          Restore as new
                        </button>
                      </form>
                      <form action={updateInquiryStatusAction}>
                        <input type="hidden" name="inquiryId" value={item.id} />
                        <input type="hidden" name="status" value="READ" />
                        <input type="hidden" name="returnTo" value="/admin/inquiries" />
                        <button className={styles.miniButton} type="submit">
                          Restore as read
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
