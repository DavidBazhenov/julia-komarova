"use client";

import { useState } from "react";

import { Button } from "../../../shared/ui";

import styles from "../../(public)/contacts/contacts.module.css";

type ContactsFormCopy = {
  submit: string;
  success: string;
  missing: string;
  failed: string;
  name: string;
  contact: string;
  contactPlaceholder: string;
  message: string;
  askButton: string;
};

type ContactsFormProps = {
  locale: string;
  artworkId?: string;
  contextualMessage: string;
  copy: ContactsFormCopy;
};

export function ContactsForm({
  locale,
  artworkId,
  contextualMessage,
  copy,
}: ContactsFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    contact?: string;
    message?: string;
  }>({});

  const validationCopy =
    locale === "ru"
      ? {
          name: "Имя должно содержать минимум 2 символа.",
          contact: "Контакт должен содержать минимум 3 символа.",
          message: "Сообщение должно содержать минимум 10 символов.",
        }
      : {
          name: "Name must contain at least 2 characters.",
          contact: "Contact must contain at least 3 characters.",
          message: "Message must contain at least 10 characters.",
        };

  function getValidationMessage(body: unknown): string | null {
    if (!body || typeof body !== "object" || !("error" in body)) {
      return null;
    }

    const error = (body as { error?: unknown }).error;
    if (!error || typeof error !== "object" || !("fields" in error)) {
      return null;
    }

    const fields = (error as { fields?: Record<string, unknown> }).fields;
    if (!fields || typeof fields !== "object") {
      return null;
    }

    for (const key of ["message", "contact", "name"]) {
      const value = fields[key];
      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
    }

    return null;
  }

  function validateFields(values: {
    name: string;
    contact: string;
    message: string;
  }) {
    const nextErrors: {
      name?: string;
      contact?: string;
      message?: string;
    } = {};

    if (values.name.trim().length < 2) {
      nextErrors.name = validationCopy.name;
    }

    if (values.contact.trim().length < 3) {
      nextErrors.contact = validationCopy.contact;
    }

    if (values.message.trim().length < 10) {
      nextErrors.message = validationCopy.message;
    }

    return nextErrors;
  }

  function handleFieldChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.currentTarget;

    setFieldErrors((current) => {
      if (!current[name as keyof typeof current]) {
        return current;
      }

      const next = { ...current };

      if (name === "name" && value.trim().length >= 2) {
        delete next.name;
      }

      if (name === "contact" && value.trim().length >= 3) {
        delete next.contact;
      }

      if (name === "message" && value.trim().length >= 10) {
        delete next.message;
      }

      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      contact: String(formData.get("contact") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      artworkId: String(formData.get("artworkId") || "").trim() || null,
      website: String(formData.get("website") || "").trim(),
      source: `contact-page:${locale}`,
    };

    const nextFieldErrors = validateFields(payload);

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setStatus("error");
      setErrorMessage(
        nextFieldErrors.message || nextFieldErrors.contact || nextFieldErrors.name || copy.missing,
      );
      return;
    }

    setFieldErrors({});

    if (payload.website) {
      setStatus("success");
      form.reset();
      return;
    }

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const code =
          body && typeof body === "object" && body.error && typeof body.error.code === "string"
            ? body.error.code
            : "submit";
        const validationMessage = getValidationMessage(body);
        setStatus("error");
        setErrorMessage(
          code === "VALIDATION_ERROR"
            ? validationMessage || copy.missing
            : copy.failed,
        );
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage(copy.failed);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input type="hidden" name="artworkId" value={artworkId ?? ""} />
      <input
        aria-hidden="true"
        autoComplete="off"
        className={styles.honeypot}
        name="website"
        tabIndex={-1}
      />
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span>{copy.name}</span>
          <input name="name" autoComplete="name" required minLength={2} onChange={handleFieldChange} />
          {fieldErrors.name ? <span className={styles.fieldError}>{fieldErrors.name}</span> : null}
        </label>
        <label className={styles.field}>
          <span>{copy.contact}</span>
          <input
            name="contact"
            autoComplete="email"
            placeholder={copy.contactPlaceholder}
            required
            minLength={3}
            onChange={handleFieldChange}
          />
          {fieldErrors.contact ? <span className={styles.fieldError}>{fieldErrors.contact}</span> : null}
        </label>
      </div>
      <label className={styles.field}>
        <span>{copy.message}</span>
        <textarea
          name="message"
          rows={5}
          required
          minLength={10}
          defaultValue={contextualMessage}
          onChange={handleFieldChange}
        />
        {fieldErrors.message ? <span className={styles.fieldError}>{fieldErrors.message}</span> : null}
      </label>
      {status === "success" ? <p className={styles.notice}>{copy.success}</p> : null}
      {status === "error" && errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
      <div className={styles.actions}>
        <button className={styles.submitButton} type="submit" disabled={status === "loading"}>
          {status === "loading" ? `${copy.submit}...` : copy.submit}
        </button>
        <Button href={`/${locale}/gallery`} variant="secondary">
          {copy.askButton}
        </Button>
      </div>
    </form>
  );
}
