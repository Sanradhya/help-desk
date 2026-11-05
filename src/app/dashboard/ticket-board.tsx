"use client";

import { useMemo, useState } from "react";
import { formatTicketNumber, type TicketStatus, type TicketView } from "@/lib/tickets";

type Move = { label: string; to: TicketStatus };

const columns: {
  status: TicketStatus;
  title: string;
  border: string;
  forward?: Move;
  back?: Move;
}[] = [
  {
    status: "OPEN",
    title: "Open",
    border: "border-t-open",
    forward: { label: "Triage", to: "TRIAGED" },
  },
  {
    status: "TRIAGED",
    title: "Triaged",
    border: "border-t-triaged",
    forward: { label: "Start work", to: "IN_PROGRESS" },
    back: { label: "Back to open", to: "OPEN" },
  },
  {
    status: "IN_PROGRESS",
    title: "In progress",
    border: "border-t-progress",
    forward: { label: "Ready for review", to: "READY_FOR_REVIEW" },
    back: { label: "Back to triaged", to: "TRIAGED" },
  },
  {
    status: "READY_FOR_REVIEW",
    title: "Awaiting developer review",
    border: "border-t-review",
    forward: { label: "Mark resolved", to: "RESOLVED" },
    back: { label: "Back to in progress", to: "IN_PROGRESS" },
  },
  {
    status: "RESOLVED",
    title: "Resolved",
    border: "border-t-resolved",
    back: { label: "Reopen", to: "OPEN" },
  },
];

export function TicketBoard({ initialTickets }: { initialTickets: TicketView[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [resolveDraft, setResolveDraft] = useState<{ id: string; note: string } | null>(null);

  const counts = useMemo(() => {
    const count = (status: TicketStatus) =>
      tickets.filter((ticket) => ticket.status === status).length;
    return {
      open: count("OPEN"),
      triaged: count("TRIAGED"),
      inProgress: count("IN_PROGRESS"),
      readyForReview: count("READY_FOR_REVIEW"),
      resolved: count("RESOLVED"),
      total: tickets.length,
    };
  }, [tickets]);

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/tickets", { credentials: "same-origin" });
      const payload = (await response.json()) as { tickets?: TicketView[]; error?: string };
      if (!response.ok || !payload.tickets) {
        setError(payload.error ?? "Could not refresh tickets.");
        return;
      }
      setTickets(payload.tickets);
    } catch {
      setError("Could not refresh tickets.");
    } finally {
      setRefreshing(false);
    }
  }

  async function moveTicket(
    id: string,
    status: TicketStatus,
    options?: { resolutionNote?: string | null },
  ) {
    const previous = tickets;
    setPendingId(id);
    setError(null);
    setTickets((current) =>
      current.map((ticket) => (ticket.id === id ? { ...ticket, status } : ticket)),
    );

    const body: { status: TicketStatus; resolutionNote?: string | null } = { status };
    if (status === "RESOLVED" && options?.resolutionNote !== undefined) {
      body.resolutionNote = options.resolutionNote;
    }

    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { ticket?: TicketView; error?: string };
      if (!response.ok || !payload.ticket) {
        setTickets(previous);
        setError(payload.error ?? "Could not update the ticket.");
        return;
      }
      setTickets((current) =>
        current.map((ticket) => (ticket.id === id ? payload.ticket! : ticket)),
      );
    } catch {
      setTickets(previous);
      setError("Could not update the ticket.");
    } finally {
      setPendingId(null);
      setResolveDraft(null);
    }
  }

  function onMoveClick(ticketId: string, move: Move) {
    if (move.to === "RESOLVED") {
      setResolveDraft({ id: ticketId, note: "" });
      return;
    }
    void moveTicket(ticketId, move.to);
  }

  function confirmResolve() {
    if (!resolveDraft) return;
    const note = resolveDraft.note.trim();
    void moveTicket(resolveDraft.id, "RESOLVED", {
      resolutionNote: note || null,
    });
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Open" value={counts.open} />
        <Stat label="Triaged" value={counts.triaged} />
        <Stat label="In progress" value={counts.inProgress} />
        <Stat label="Awaiting developer review" value={counts.readyForReview} />
        <Stat label="Resolved" value={counts.resolved} />
        <Stat label="All tickets" value={counts.total} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted" aria-live="polite">
          {error ?? "Every submitted ticket is listed in one of the columns."}
        </p>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="shrink-0 rounded-full border border-line bg-card px-4 py-2 text-sm transition hover:border-ink disabled:opacity-60"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {columns.map((column) => {
          const items = tickets.filter((ticket) => ticket.status === column.status);
          return (
            <section
              key={column.status}
              className={`rounded-2xl border border-line border-t-4 bg-card ${column.border}`}
            >
              <header className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 className="text-sm font-semibold">{column.title}</h2>
                <span className="font-mono text-xs text-muted">{items.length}</span>
              </header>
              <ul className="space-y-3 p-3">
                {items.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                    No {column.title.toLowerCase()} tickets.
                  </li>
                ) : (
                  items.map((ticket) => (
                    <li key={ticket.id} className="rounded-xl border border-line bg-paper p-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-full bg-card px-2.5 py-1 text-xs font-medium text-ink ring-1 ring-line">
                          {ticket.project}
                        </span>
                        <time
                          dateTime={ticket.createdAt}
                          className="text-xs text-muted"
                        >
                          {formatWhen(ticket.createdAt)}
                        </time>
                      </div>
                      <p className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-sm leading-6">
                        {ticket.description}
                      </p>
                      {ticket.resolutionSummary ? (
                        <AgentReview summary={ticket.resolutionSummary} />
                      ) : null}
                      {ticket.status === "RESOLVED" && ticket.resolutionNote ? (
                        <p className="mt-3 whitespace-pre-wrap text-xs text-muted">
                          <span className="font-semibold text-ink">Developer note: </span>
                          {ticket.resolutionNote}
                        </p>
                      ) : null}
                      <p className="mt-3 truncate font-mono text-[11px] text-muted">
                        {formatTicketNumber(ticket.number)}
                      </p>
                      {resolveDraft?.id === ticket.id ? (
                        <div className="mt-3 space-y-2 rounded-lg bg-card p-3 ring-1 ring-line">
                          <label
                            htmlFor={`resolve-note-${ticket.id}`}
                            className="block text-xs font-medium text-ink"
                          >
                            Developer note (optional)
                          </label>
                          <input
                            id={`resolve-note-${ticket.id}`}
                            type="text"
                            value={resolveDraft.note}
                            onChange={(event) =>
                              setResolveDraft({ id: ticket.id, note: event.target.value })
                            }
                            className="w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-copper"
                          />
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              disabled={pendingId === ticket.id}
                              onClick={confirmResolve}
                              className="text-sm font-medium text-copper underline-offset-4 hover:underline disabled:opacity-60"
                            >
                              {pendingId === ticket.id ? "Saving…" : "Confirm resolve"}
                            </button>
                            <button
                              type="button"
                              disabled={pendingId === ticket.id}
                              onClick={() => setResolveDraft(null)}
                              className="text-sm text-muted underline-offset-4 hover:underline disabled:opacity-60"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                          {[column.forward, column.back].map((move) =>
                            move ? (
                              <button
                                key={move.to}
                                type="button"
                                disabled={pendingId === ticket.id}
                                onClick={() => onMoveClick(ticket.id, move)}
                                className="text-sm font-medium text-copper underline-offset-4 hover:underline disabled:opacity-60"
                              >
                                {pendingId === ticket.id ? "Saving…" : move.label}
                              </button>
                            ) : null,
                          )}
                        </div>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function AgentReview({ summary }: { summary: string }) {
  return (
    <details className="mt-3 rounded-lg bg-card p-2 text-xs text-muted ring-1 ring-line">
      <summary className="cursor-pointer font-semibold text-ink">Show agent review</summary>
      <p className="mt-2 whitespace-pre-wrap">{summary}</p>
    </details>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
