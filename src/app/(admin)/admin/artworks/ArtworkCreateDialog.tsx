"use client";

import { useEffect, useState, type ReactNode } from "react";

import styles from "../admin.module.css";

type ArtworkCreateDialogProps = {
  children: ReactNode;
};

export function ArtworkCreateDialog({ children }: ArtworkCreateDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button className={styles.modalTrigger} type="button" onClick={() => setOpen(true)}>
        Add artwork
      </button>
      {open ? (
        <div
          aria-modal="true"
          className={styles.dialogBackdrop}
          onClick={() => setOpen(false)}
          role="dialog"
        >
          <div className={styles.dialogCard} onClick={(event) => event.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <div>
                <h2>Create artwork</h2>
                <p className={styles.muted}>
                  Create the artwork record first. Image upload becomes available after saving in the Media column and on the artwork edit page.
                </p>
              </div>
              <button
                aria-label="Close create artwork dialog"
                className={styles.dialogClose}
                type="button"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            {children}
          </div>
        </div>
      ) : null}
    </>
  );
}
