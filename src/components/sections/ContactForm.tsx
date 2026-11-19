"use client";

import { useId, useState } from "react";
import { contact } from "@/content/content";
import {
  MESSAGE_MAX_LENGTH,
  NAME_MAX_LENGTH,
  buildLeadMessage,
  isProjectTypeId,
  projectTypes,
  validateLead,
  whatsappUrl,
} from "@/lib/whatsapp";

type Status = "idle" | "opening" | "blocked";

const field =
  "w-full rounded-md border border-border-strong bg-bg-deep px-4 py-3 text-text placeholder:text-text-muted";

/**
 * 3.10 Mini-formulário. Sem backend e sem guardar nada: monta a mensagem e abre o
 * WhatsApp. Só o nome é obrigatório. Se o navegador bloquear a nova aba, mostra o link.
 */
export function ContactForm() {
  const id = useId();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");
  const [nameError, setNameError] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [url, setUrl] = useState("");
  const f = contact.form;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = { name, projectType: isProjectTypeId(type) ? type : undefined, message };
    if (validateLead(input).name) {
      setNameError(true);
      document.getElementById(`${id}-name`)?.focus();
      return;
    }
    setNameError(false);
    const link = whatsappUrl(buildLeadMessage(input));
    setUrl(link);
    setStatus("opening");
    // Aberto no mesmo gesto do clique; null = bloqueado pelo navegador
    const opened = window.open(link, "_blank", "noopener,noreferrer");
    setStatus(opened ? "idle" : "blocked");
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mx-auto mt-10 grid max-w-[34rem] gap-5 text-left"
    >
      <div>
        <label htmlFor={`${id}-name`} className="mb-2 block font-bold text-text">
          {f.name.label}
        </label>
        <input
          id={`${id}-name`}
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={NAME_MAX_LENGTH}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(false);
          }}
          aria-invalid={nameError}
          aria-describedby={nameError ? `${id}-name-error` : undefined}
          className={field}
        />
        {nameError && (
          <p id={`${id}-name-error`} role="alert" className="mt-2 text-sm text-error">
            {f.name.errorEmpty}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-type`} className="mb-2 block font-bold text-text">
          {f.projectType.label}
        </label>
        <select
          id={`${id}-type`}
          name="projectType"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={field}
        >
          <option value="">{f.projectType.placeholder}</option>
          {projectTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${id}-message`} className="mb-2 block font-bold text-text">
          {f.message.label}
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={4}
          maxLength={MESSAGE_MAX_LENGTH}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-describedby={`${id}-message-hint`}
          className={field}
        />
        <p id={`${id}-message-hint`} className="mt-2 flex justify-between text-sm text-text-muted">
          <span>{f.message.hint}</span>
          <span aria-hidden="true">
            {message.length}/{MESSAGE_MAX_LENGTH}
          </span>
        </p>
      </div>

      <button
        type="submit"
        data-magnetic
        disabled={status === "opening"}
        className="rounded-pill bg-brand px-6 py-3 font-bold text-text-on-brand transition-colors duration-(--dur-fast) ease-standard hover:bg-brand-hover disabled:opacity-60"
      >
        {status === "opening" ? f.submitting : f.submit}
      </button>

      <div aria-live="polite" className="min-h-6 text-sm">
        {status === "blocked" && (
          <p className="text-text">
            {f.popupBlocked}{" "}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand underline underline-offset-4"
            >
              {f.popupBlockedLink}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </p>
        )}
      </div>

      <p className="text-sm text-text-muted">{f.privacyNote}</p>
    </form>
  );
}
