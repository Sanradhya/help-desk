"use client";

import { useState } from "react";
import {
  formatTicketNumber,
  MAX_DESCRIPTION_LENGTH,
  PROJECT_NAMES,
  type TicketView,
} from "@/lib/tickets";

type SubmitResult = {
  ticket: TicketView;
  webhookDelivered: boolean;
  webhookError?: string;
};

export function SupportForm() {
  const [project, setProject] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, description }),
      });
      const payload = (await response.json()) as SubmitResult & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not submit the ticket.");
        return;
      }
      setResult(payload);
      setProject("");
      setDescription("");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-line bg-card p-6 shadow-[0_1px_0_rgba(28,25,23,0.04)] sm:p-8"
    >
      <div className="space-y-2">
        <label htmlFor="project" className="block text-sm font-medium">
          Project
        </label>
        <select
          id="project"
          name="project"
          required
          value={project}
          onChange={(event) => setProject(event.target.value)}
          className="w-full rounded-xl border border-line bg-paper px-3 py-3 text-sm outline-none transition focus:border-copper"
        >
          <option value="" disabled>
            Select a project
          </option>
          {PROJECT_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="description" className="block text-sm font-medium">
            Bug description
          </label>
          <span className="text-xs text-muted">
            {description.trim().length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
        <textarea
          id="description"
          name="description"
          required
          rows={8}
          maxLength={MAX_DESCRIPTION_LENGTH}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What happened, where, and what you expected instead."
          className="w-full resize-y rounded-xl border border-line bg-paper px-3 py-3 text-sm leading-6 outline-none transition focus:border-copper"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-paper transition hover:bg-copper disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit bug"}
      </button>

      <div className="mt-4 min-h-6 text-sm" aria-live="polite">
        {error ? <p className="text-copper">{error}</p> : null}
        {result ? (
          <div className="rounded-xl border border-line bg-paper px-4 py-3">
            <p className="font-medium text-ink">Ticket filed.</p>
            <p className="mt-1 font-mono text-xs text-muted">
              {formatTicketNumber(result.ticket.number)}
            </p>
            <p className="mt-2 text-muted">
              {result.webhookDelivered
                ? "Discord was notified with the ticket id, project, and description."
                : `Saved in the database. Discord was not notified${result.webhookError ? `: ${result.webhookError}` : "."}`}
            </p>
          </div>
        ) : null}
      </div>
    </form>
  );
}
