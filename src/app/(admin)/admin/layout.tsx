import type { ReactNode } from "react";
import Link from "next/link";

import { readAdminSession } from "@/server/auth";

import { logoutAdminAction } from "./actions";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await readAdminSession();

  return (
    <div className={styles.shell}>
      <div className={styles.frame}>
        {session ? (
          <header className={styles.header}>
            <div className={styles.brand}>
              <p className={styles.eyebrow}>Admin</p>
              <h1 className={styles.brandTitle}>Julia Komarova CMS</h1>
              <p className={styles.muted}>{`Signed in as ${session.email}`}</p>
            </div>
            <nav className={styles.nav}>
              <Link className={styles.navLink} href="/admin">
                Dashboard
              </Link>
              <Link className={styles.navLink} href="/admin/artworks">
                Artworks
              </Link>
              <Link className={styles.navLink} href="/admin/categories">
                Categories
              </Link>
              <form action={logoutAdminAction}>
                <button className={styles.ghostButton} type="submit">
                  Logout
                </button>
              </form>
            </nav>
          </header>
        ) : null}
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
