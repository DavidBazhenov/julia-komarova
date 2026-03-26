import { redirect } from "next/navigation";

import { hasAdminSession } from "@/server/auth";

import { loginAdminAction } from "../actions";
import styles from "../admin.module.css";

type AdminLoginPageProps = {
  searchParams?: {
    error?: string;
    next?: string;
    logged_out?: string;
  };
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  if (await hasAdminSession()) {
    redirect("/admin");
  }

  const next = searchParams?.next ?? "/admin";

  return (
    <section className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <p className={styles.eyebrow}>Admin access</p>
        <h1 className={styles.panelTitle}>Login</h1>
        <p className={styles.helper}>
          Sign in with the configured admin credentials. Session cookie is signed on
          the server.
        </p>
        {searchParams?.logged_out ? (
          <p className={styles.notice}>Logged out.</p>
        ) : null}
        {searchParams?.error ? (
          <p className={styles.error}>Invalid email or password.</p>
        ) : null}
        <form action={loginAdminAction} className={styles.form}>
          <input type="hidden" name="next" value={next} />
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button className={styles.submitButton} type="submit">
            Sign in
          </button>
        </form>
      </div>
    </section>
  );
}
