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
        <header className={styles.header}>
          <div className={styles.brand}>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.brandTitle}>Julia Komarova CMS</h1>
            <p className={styles.muted}>
              {session ? `Signed in as ${session.email}` : "Unauthenticated"}
            </p>
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
            <Link className={styles.navLink} href="/admin/exhibitions">
              Exhibitions
            </Link>
            <Link className={styles.navLink} href="/admin/exhibition-categories">
              Exhibition categories
            </Link>
            {session ? (
              <form action={logoutAdminAction}>
                <button className={styles.ghostButton} type="submit">
                  Logout
                </button>
              </form>
            ) : (
              <Link className={styles.navLink} href="/admin/login">
                Login
              </Link>
            )}
          </nav>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
