"use client";

import { useFormStatus } from "react-dom";

import styles from "../admin.module.css";

type UploadSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
};

export function UploadSubmitButton({
  idleLabel,
  pendingLabel,
}: UploadSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`${styles.submitButton} ${pending ? styles.submitButtonPending : ""}`}
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (
        <span className={styles.pendingInline}>
          <span className={styles.spinner} aria-hidden="true" />
          {pendingLabel}
        </span>
      ) : (
        idleLabel
      )}
    </button>
  );
}
